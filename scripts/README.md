# Scripts Directory

This directory contains utility scripts for the LRE Manager application.

## Available Scripts

### generate_transactions.sh
A shell script that generates fake transaction data for testing purposes. It creates:
- An Annual Program with $15M budget
- A Period of Performance Program with $12M budget (18 months)
- 40 transactions per program with varying amounts and dates
- Mix of transactions with and without actuals

Usage:
```bash
./generate_transactions.sh
```

### generate_transactions.py
A Python script that provides an alternative implementation of the transaction generator. This script requires the `requests` package to be installed.

Usage:
```bash
python3 generate_transactions.py
```

## Requirements
- For the shell script: bash, curl, bc
- For the Python script: Python 3.x, requests package 