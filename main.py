import warnings
warnings.filterwarnings('ignore')

import pandas as pd
import numpy as np
import os
import json
import logging
import joblib

from src.data.data_loader import load_data
from src.features.preprocessing import create_features, split_data
from src.models.clustering import ColdStartResolver
from src.models.forecaster import LGBMForecaster, XGBForecaster
from src.models.optimizer import tune_hyperparameters
from src.evaluation.metrics import evaluate_predictions, calculate_business_value

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')

MODEL_DIR = 'models'
os.makedirs(MODEL_DIR, exist_ok=True)


def apply_cold_start(test, imputed_sales):
    imputed_indexed = imputed_sales.set_index(['item_id', 'date'])['proxy_sales']
    test_index = pd.MultiIndex.from_arrays([test['item_id'], test['date']])
    mask = test_index.isin(imputed_indexed.index)
    test.loc[mask, 'pred'] = imputed_indexed.reindex(test_index[mask]).values
    return test


def main():
    logging.info("Starting Retail Demand Optimizer Pipeline...")

    logging.info("Loading dataset...")
    df = load_data('data/retail_data.csv')

    cold_start_item_id = 50
    df = df[~((df['item_id'] == cold_start_item_id) & (df['date'] < df['date'].max() - pd.Timedelta(days=14)))]

    logging.info("Creating features...")
    df_features = create_features(df, lag_horizon=14)

    logging.info("Splitting data into train, val, test...")
    train, val, test = split_data(df_features, validation_days=28, test_days=14)

    features = [c for c in train.columns if c not in ['date', 'sales', 'category']]
    target = 'sales'

    X_train, y_train = train[features], train[target]
    X_val, y_val = val[features], val[target]
    X_test, y_test = test[features], test[target]

    logging.info("Training Cold Start Resolver (Clustering)...")
    clusterer = ColdStartResolver(n_clusters=5)
    df_items = train[['item_id', 'base_price', 'category', 'dept_id']].drop_duplicates()
    clusterer.fit(df_items, train)
    joblib.dump(clusterer, os.path.join(MODEL_DIR, 'clusterer.pkl'))

    logging.info("Tuning LGBM Hyperparameters with Optuna...")
    best_params = tune_hyperparameters(X_train, y_train, X_val, y_val, n_trials=5)

    logging.info("Training final LGBM model...")
    lgbm_model = LGBMForecaster(params=best_params)
    lgbm_model.fit(X_train, y_train, X_val, y_val)
    joblib.dump(lgbm_model, os.path.join(MODEL_DIR, 'lgbm_model.pkl'))

    logging.info("Training XGBoost model...")
    xgb_model = XGBForecaster()
    xgb_model.fit(X_train, y_train, X_val, y_val)
    joblib.dump(xgb_model, os.path.join(MODEL_DIR, 'xgb_model.pkl'))

    logging.info("Evaluating on Test Set...")
    lgbm_pred = lgbm_model.predict(X_test)
    xgb_pred = xgb_model.predict(X_test)
    y_pred = (lgbm_pred + xgb_pred) / 2

    test = test.copy()
    test['pred'] = y_pred

    new_items_df = (
        test[test['item_id'] == cold_start_item_id][['item_id', 'base_price', 'category', 'dept_id']]
        .drop_duplicates()
    )

    if not new_items_df.empty:
        logging.info(f"Applying Cold Start logic for item {cold_start_item_id}...")
        target_dates = test[test['item_id'] == cold_start_item_id]['date'].unique()
        imputed_sales = clusterer.impute_new_items(new_items_df, target_dates)
        test = apply_cold_start(test, imputed_sales)

    y_pred_final = test['pred'].values

    ml_metrics = evaluate_predictions(y_test, y_pred_final, test)
    logging.info(f"ML Metrics: {ml_metrics}")

    baseline_pred = test['sales_lag_14'].fillna(0).values

    biz_metrics, df_eval = calculate_business_value(test, y_pred_final, baseline_pred)
    logging.info("Business Metrics:")
    for k, v in biz_metrics.items():
        logging.info(f"  {k}: ${v:,.2f}")

    with open('results_summary.md', 'w') as f:
        f.write("# Retail Demand Optimizer Results\n\n")
        f.write("## Machine Learning Metrics\n")
        f.write(f"- **RMSE**: {ml_metrics['RMSE']:.2f}\n")
        f.write(f"- **MAE**: {ml_metrics['MAE']:.2f}\n\n")
        f.write("## Business Value (vs. Naive 14-day Lag Baseline)\n")
        for k, v in biz_metrics.items():
            f.write(f"- **{k}**: ${v:,.2f}\n")

    logging.info("Pipeline complete. Results saved to results_summary.md.")


if __name__ == "__main__":
    main()