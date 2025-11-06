#!/usr/bin/env python3
"""
Create markdown summary of parameter sweep results
"""

import argparse
import pandas as pd
import numpy as np
import sys

def main():
    parser = argparse.ArgumentParser(description='Create result summary')
    parser.add_argument('--input', type=str, required=True,
                        help='Input combined CSV file')
    parser.add_argument('--output', type=str, required=True,
                        help='Output markdown file')
    
    args = parser.parse_args()
    
    print(f"\n{'='*70}")
    print(f"CREATING SUMMARY")
    print(f"{'='*70}")
    
    # Load data
    try:
        df = pd.read_csv(args.input)
        print(f"✓ Loaded {len(df)} rows from {args.input}")
    except Exception as e:
        print(f"✗ Error loading data: {e}")
        sys.exit(1)
    
    # Validate required columns
    required_cols = ['param_name', 'param_value']
    missing_cols = [col for col in required_cols if col not in df.columns]
    if missing_cols:
        print(f"✗ Missing required columns: {missing_cols}")
        sys.exit(1)
    
    param_name = df['param_name'].iloc[0]
    param_values = sorted(df['param_value'].unique())
    
    print(f"  Parameter: {param_name}")
    print(f"  Values: {param_values}")
    
    # Generate summary
    summary = []
    summary.append(f"# Parameter Sweep Results\n")
    summary.append(f"## Parameter: `{param_name}`\n")
    summary.append(f"**Total Runs:** {len(df)}\n")
    summary.append(f"**Parameter Values Tested:** {', '.join(map(str, param_values))}\n")
    summary.append(f"**Runs per Value:** {len(df) // len(param_values)}\n")
    
    # Results table
    summary.append("\n## Results by Parameter Value\n")
    summary.append("| Value | Infected (mean±std) | Reinfected (mean±std) | Long COVID (mean±std) | Min Productivity (mean±std) |")
    summary.append("|-------|---------------------|----------------------|------------------------|------------------------------|")
    
    for value in param_values:
        subset = df[df['param_value'] == value]
        
        # Infected
        if 'infected' in df.columns:
            inf_mean = subset['infected'].mean()
            inf_std = subset['infected'].std()
            inf_str = f"{inf_mean:,.0f}±{inf_std:,.0f}"
        else:
            inf_str = "N/A"
        
        # Reinfected
        if 'reinfected' in df.columns:
            reinf_mean = subset['reinfected'].mean()
            reinf_std = subset['reinfected'].std()
            reinf_str = f"{reinf_mean:,.0f}±{reinf_std:,.0f}"
        else:
            reinf_str = "N/A"
        
        # Long COVID
        if 'long_covid_cases' in df.columns:
            lc_mean = subset['long_covid_cases'].mean()
            lc_std = subset['long_covid_cases'].std()
            lc_str = f"{lc_mean:,.0f}±{lc_std:,.0f}"
        else:
            lc_str = "N/A"
        
        # Productivity
        if 'min_productivity' in df.columns:
            prod_mean = subset['min_productivity'].mean()
            prod_std = subset['min_productivity'].std()
            prod_str = f"{prod_mean:.1f}±{prod_std:.1f}%"
        else:
            prod_str = "N/A"
        
        summary.append(
            f"| {value} | {inf_str} | {reinf_str} | {lc_str} | {prod_str} |"
        )
    
    # Key findings
    summary.append("\n## Key Findings\n")
    
    avg_by_value = df.groupby('param_value').agg({
        col: 'mean' for col in df.columns if col in [
            'infected', 'reinfected', 'long_covid_cases', 
            'min_productivity', 'runtime_days'
        ]
    }).reset_index()
    
    # Find optimal values
    if 'infected' in avg_by_value.columns:
        min_infected_val = avg_by_value.loc[avg_by_value['infected'].idxmin(), 'param_value']
        min_infected = avg_by_value['infected'].min()
        max_infected_val = avg_by_value.loc[avg_by_value['infected'].idxmax(), 'param_value']
        max_infected = avg_by_value['infected'].max()
        
        summary.append(f"### Infections")
        summary.append(f"- **Lowest infections:** `{param_name} = {min_infected_val}` ({min_infected:,.0f} cases)")
        summary.append(f"- **Highest infections:** `{param_name} = {max_infected_val}` ({max_infected:,.0f} cases)")
        summary.append(f"- **Range:** {((max_infected - min_infected) / min_infected * 100):.1f}% difference\n")
    
    if 'long_covid_cases' in avg_by_value.columns:
        min_lc_val = avg_by_value.loc[avg_by_value['long_covid_cases'].idxmin(), 'param_value']
        min_lc = avg_by_value['long_covid_cases'].min()
        max_lc_val = avg_by_value.loc[avg_by_value['long_covid_cases'].idxmax(), 'param_value']
        max_lc = avg_by_value['long_covid_cases'].max()
        
        summary.append(f"### Long COVID")
        summary.append(f"- **Lowest Long COVID:** `{param_name} = {min_lc_val}` ({min_lc:,.0f} cases)")
        summary.append(f"- **Highest Long COVID:** `{param_name} = {max_lc_val}` ({max_lc:,.0f} cases)")
        summary.append(f"- **Range:** {((max_lc - min_lc) / min_lc * 100):.1f}% difference\n")
    
    if 'min_productivity' in avg_by_value.columns:
        max_prod_val = avg_by_value.loc[avg_by_value['min_productivity'].idxmax(), 'param_value']
        max_prod = avg_by_value['min_productivity'].max()
        min_prod_val = avg_by_value.loc[avg_by_value['min_productivity'].idxmin(), 'param_value']
        min_prod = avg_by_value['min_productivity'].min()
        
        summary.append(f"### Productivity")
        summary.append(f"- **Highest productivity:** `{param_name} = {max_prod_val}` ({max_prod:.1f}%)")
        summary.append(f"- **Lowest productivity:** `{param_name} = {min_prod_val}` ({min_prod:.1f}%)")
        summary.append(f"- **Range:** {(max_prod - min_prod):.1f} percentage points\n")
    
    if 'runtime_days' in avg_by_value.columns:
        avg_runtime = avg_by_value['runtime_days'].mean()
        summary.append(f"### Epidemic Duration")
        summary.append(f"- **Average duration:** {avg_runtime:.0f} days\n")
    
    # Recommendations
    summary.append("\n## Recommendations\n")
    
    if 'infected' in avg_by_value.columns and 'long_covid_cases' in avg_by_value.columns:
        # Find best overall value (minimize infections + long covid)
        avg_by_value['combined_score'] = (
            avg_by_value['infected'] / avg_by_value['infected'].max() +
            avg_by_value['long_covid_cases'] / avg_by_value['long_covid_cases'].max()
        )
        best_val = avg_by_value.loc[avg_by_value['combined_score'].idxmin(), 'param_value']
        
        summary.append(f"Based on this analysis:\n")
        summary.append(f"- **Optimal setting:** `{param_name} = {best_val}` (minimizes combined infections and Long COVID)\n")
        
        if param_name == 'vaccination_pct':
            summary.append(f"- Higher vaccination rates substantially reduce both infections and Long COVID burden")
        elif param_name == 'precaution_pct':
            summary.append(f"- Greater adherence to precautions when symptomatic reduces transmission")
        elif param_name == 'covid_spread_chance_pct':
            summary.append(f"- Lower transmission rates (achievable through NPIs) significantly reduce epidemic burden")
    
    # Statistical notes
    summary.append("\n## Statistical Notes\n")
    summary.append(f"- Results based on {len(df)} total simulation runs")
    summary.append(f"- Error bars represent standard deviation across replicates")
    summary.append(f"- Variations reflect stochastic nature of epidemic dynamics")
    
    # Write to file
    summary_text = '\n'.join(summary)
    try:
        with open(args.output, 'w') as f:
            f.write(summary_text)
        print(f"✓ Summary written to {args.output}")
        print(f"  Length: {len(summary_text)} characters")
        print(f"{'='*70}\n")
    except Exception as e:
        print(f"✗ Error writing summary: {e}")
        sys.exit(1)

if __name__ == "__main__":
    main()
