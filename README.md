# Intelligent Retail Demand & Supply Chain Optimizer

This project provides a robust machine learning pipeline for predicting retail demand 14-30 days into the future. It addresses real-world supply chain challenges by translating predictive accuracy into actionable business value (Dollars Saved) and solving the "Cold Start" problem for brand new items.

## Features

- **Synthetic Data Generation**: Automatically generates a realistic retail dataset (seasonality, promotions, holidays) if no dataset is provided.
- **Advanced Feature Engineering**: Time-based features, rolling windows, and lagged variables designed to prevent data leakage over the forecast horizon.
- **Metadata Clustering (Cold Start)**: Uses K-Means clustering on item metadata (category, department, price) to impute demand for brand new items with zero sales history.
- **Hyperparameter Optimization**: Integrates `optuna` to automatically find the best model parameters.
- **Business-First Evaluation**: Calculates the financial cost of overstocking and understocking, outputting the net "Dollars Saved" against a baseline model.

## Setup

1. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```

2. Run the pipeline:
   ```bash
   python main.py
   ```

## Architecture

- `src/data/`: Data loading and synthetic generation.
- `src/features/`: Feature engineering and data splitting.
- `src/models/`: Wrappers for LightGBM/XGBoost/Prophet, Clustering logic, and Optuna tuning.
- `src/evaluation/`: Custom financial metrics calculation.
