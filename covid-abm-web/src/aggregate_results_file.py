#!/usr/bin/env python3
"""
Aggregate results from parallel GitHub Actions runs and create plots
"""

import argparse
import pandas as pd
import matplotlib.pyplot as plt
import numpy as np
from pathlib import Path
import sys

def main():
    parser = argparse.ArgumentParser(description='Aggregate parallel simulation results')
    parser.add_argument('--input_dir', type=str, required=True,
                        help='Directory containing result artifacts')
    parser.add_argument('--output', type=str, required=True,
                        help='Output combined CSV file')
    parser.add_argument('--plot', type=str, required=True,
                        help='Output plot file')
    
    args = parser.parse_args()
    
    print(f"\n{'='*70}")
    print(f"AGGREGATING RESULTS")
    print(f"{'='*70}")
    
    # Find all CSV files in subdirectories
    input_path = Path(args.input_dir)
    csv_files = list(input_path.rglob("*.csv"))
    
    print(f"Found {len(csv_files)} result files")
    
    if not csv_files:
        print("ERROR: No CSV files found!")
        sys.exit(1)
    
    # Load and combine all results
    dfs = []
    for csv_file in csv_files:
        try:
            df = pd.read_csv(csv_file)
            dfs.append(df)
            print(f"  ✓ Loaded {csv_file.name}: {len(df)} rows")
        except Exception as e:
            print(f"  ✗ Error loading {csv_file.name}: {e}")
    
    if not dfs:
        print("ERROR: No valid data loaded!")
        sys.exit(1)
    
    # Combine all dataframes
    combined_df = pd.concat(dfs, ignore_index=True)
    
    # Save combined results
    combined_df.to_csv(args.output, index=False)
    print(f"\n✓ Saved combined results to {args.output}")
    print(f"  Total rows: {len(combined_df)}")
    print(f"  Columns: {', '.join(combined_df.columns)}")
    
    # Print summary by parameter value
    if 'param_name' in combined_df.columns and 'param_value' in combined_df.columns:
        param_name = combined_df['param_name'].iloc[0]
        print(f"\n  Parameter: {param_name}")
        for value in sorted(combined_df['param_value'].unique()):
            count = len(combined_df[combined_df['param_value'] == value])
            print(f"    Value {value}: {count} runs")
    
    # Create visualization
    print(f"\n📊 Creating visualization...")
    create_plot(combined_df, args.plot)
    print(f"✓ Saved plot to {args.plot}")
    print(f"{'='*70}\n")

def create_plot(df, output_file):
    """Create comprehensive visualization of results"""
    
    if 'param_name' not in df.columns or 'param_value' not in df.columns:
        print("Warning: Missing param_name or param_value columns, skipping plot")
        return
    
    param_name = df['param_name'].iloc[0]
    param_values = sorted(df['param_value'].unique())
    
    # Create figure with subplots
    fig, axes = plt.subplots(2, 2, figsize=(14, 10))
    fig.suptitle(f'Parameter Sweep: {param_name}', fontsize=16, fontweight='bold')
    
    metrics = [
        ('infected', 'Total Infected Cases', 'blue'),
        ('reinfected', 'Reinfection Cases', 'orange'),
        ('long_covid_cases', 'Long COVID Cases', 'red'),
        ('min_productivity', 'Minimum Productivity (%)', 'green')
    ]
    
    for idx, (metric, title, color) in enumerate(metrics):
        ax = axes[idx // 2, idx % 2]
        
        if metric not in df.columns:
            ax.text(0.5, 0.5, f'{metric} not found', 
                   ha='center', va='center', transform=ax.transAxes)
            ax.set_title(title, fontsize=12)
            continue
        
        # Prepare data for boxplot
        data = []
        for value in param_values:
            subset = df[df['param_value'] == value][metric].values
            data.append(subset)
        
        # Create boxplot
        bp = ax.boxplot(data, labels=[str(v) for v in param_values],
                        patch_artist=True, showfliers=False)
        
        # Color the boxes
        for patch in bp['boxes']:
            patch.set_facecolor(color)
            patch.set_alpha(0.6)
        
        # Add mean line
        means = [np.mean(d) if len(d) > 0 else 0 for d in data]
        ax.plot(range(1, len(param_values) + 1), means, 
               marker='^', color='darkred', linewidth=2, 
               markersize=8, label='Mean', zorder=10)
        
        # Formatting
        ax.set_xlabel(param_name, fontsize=11, fontweight='bold')
        ax.set_ylabel(title, fontsize=11, fontweight='bold')
        ax.set_title(title, fontsize=12)
        ax.grid(True, alpha=0.3, linestyle='--')
        ax.legend(loc='best')
        
        # Rotate x-axis labels if needed
        if len(param_values) > 6:
            ax.tick_params(axis='x', rotation=45)
    
    plt.tight_layout()
    plt.savefig(output_file, dpi=200, bbox_inches='tight')
    plt.close()
    print(f"  Plot saved with {len(metrics)} panels")

if __name__ == "__main__":
    main()
