import numpy as np
import pandas as pd
import matplotlib.pyplot as plt
import seaborn as sns
from covid_abm_model import FixedGPUABM
import time
SEED_ARRAY = [42, 123, 456, 789, 1011, 2022, 3033, 4044, 5055, 6066]
PARAMETER_SWEEP = {
    'covid_spread_chance_pct': [5, 10, 15, 20],
    'vaccination_pct': [0, 30, 50, 70, 90],
    'precaution_pct': [0, 25, 50, 75],
}
BASELINE = {
    'max_days': 365,
    'initial_infected_agents': 5,
    'avg_degree': 5,
    'asymptomatic_pct': 40.0,
    'long_covid': True,
    # ... all other defaults from config
}

# Simulation settings
N_AGENTS = 100000  # Population size
OUTPUT_FILE = 'publication_results.csv'


# ============================================
# MAIN SWEEP FUNCTION
# ============================================

def run_publication_sweep(
    param_dict=PARAMETER_SWEEP,
    seed_array=SEED_ARRAY,
    n_agents=N_AGENTS,
    output_file=OUTPUT_FILE
):
    """
    Run parameter sweep with multiple seeds per parameter value.
    
    This is the GOLD STANDARD for publication:
    - Tests multiple parameter values (scenarios)
    - Runs each scenario multiple times (uncertainty)
    - Calculates statistics (mean, std, CI)
    """
    
    all_results = []
    total_sims = sum(len(values) * len(seed_array) for values in param_dict.values())
    sim_count = 0
    start_time = time.time()
    
    print("\n" + "="*80)
    print("PUBLICATION-QUALITY PARAMETER SWEEP")
    print("="*80)
    print(f"Population:        {n_agents:,} agents")
    print(f"Seeds per param:   {len(seed_array)} replications")
    print(f"Total simulations: {total_sims}")
    print(f"Output file:       {output_file}")
    print("="*80 + "\n")
    
    # Loop through each parameter
    for param_name, param_values in param_dict.items():
        print(f"\n{'='*80}")
        print(f"SWEEPING: {param_name}")
        print(f"{'='*80}")
        
        # Loop through each value of this parameter
        for param_value in param_values:
            print(f"\n  📊 Testing {param_name} = {param_value}")
            
            # Run multiple times with different seeds
            for i, seed in enumerate(seed_array):
                sim_count += 1
                
                # Initialize model
                abm = FixedGPUABM()
                
                # Set baseline config
                for key, value in BASELINE.items():
                    if key in abm.config:
                        abm.config[key] = value
                
                # Override the parameter being swept
                abm.config[param_name] = param_value
                
                # Run simulation
                abm.initialize_simulation(N=n_agents, seed=seed)
                results = abm.run_simulation(verbose=False, save_timeseries=False)
                
                # Add metadata
                results['param_name'] = param_name
                results['param_value'] = param_value
                results['seed'] = seed
                results['replication'] = i
                results['n_agents'] = n_agents
                
                all_results.append(results)
                
                # Progress update
                if (i + 1) % 5 == 0:
                    elapsed = time.time() - start_time
                    rate = sim_count / elapsed if elapsed > 0 else 0
                    eta = (total_sims - sim_count) / rate / 60 if rate > 0 else 0
                    print(f"    ✓ Replication {i+1}/{len(seed_array)} | "
                          f"Progress: {sim_count}/{total_sims} | ETA: {eta:.1f} min")
    
    # Convert to DataFrame
    df = pd.DataFrame(all_results)
    
    # Save raw results
    df.to_csv(output_file, index=False)
    
    total_time = time.time() - start_time
    print(f"\n{'='*80}")
    print(f"SWEEP COMPLETE")
    print(f"{'='*80}")
    print(f"Total time:      {total_time/60:.1f} minutes")
    print(f"Avg per sim:     {total_time/total_sims:.1f} seconds")
    print(f"Results saved:   {output_file}")
    print(f"{'='*80}\n")
    
    return df


# ============================================
# STATISTICAL ANALYSIS
# ============================================

def calculate_statistics(df):
    """
    Calculate mean, std, confidence intervals for each parameter value.
    This is what you report in publications!
    """
    
    # Group by parameter name and value
    grouped = df.groupby(['param_name', 'param_value'])
    
    # Calculate statistics for key metrics
    metrics = ['infected', 'long_covid_cases', 'peak_infected', 'min_productivity']
    
    stats_list = []
    for (param_name, param_value), group in grouped:
        stats = {'param_name': param_name, 'param_value': param_value}
        
        for metric in metrics:
            values = group[metric].values
            mean = np.mean(values)
            std = np.std(values)
            sem = std / np.sqrt(len(values))  # Standard error of mean
            ci_95 = 1.96 * sem  # 95% confidence interval
            
            stats[f'{metric}_mean'] = mean
            stats[f'{metric}_std'] = std
            stats[f'{metric}_sem'] = sem
            stats[f'{metric}_ci95'] = ci_95
            stats[f'{metric}_min'] = np.min(values)
            stats[f'{metric}_max'] = np.max(values)
        
        stats['n_replications'] = len(group)
        stats_list.append(stats)
    
    stats_df = pd.DataFrame(stats_list)
    return stats_df


# ============================================
# VISUALIZATION FOR PUBLICATION
# ============================================

def plot_publication_figures(df, stats_df, output_prefix='publication'):
    """
    Generate publication-quality figures with error bars
    """
    
    # Set publication style
    sns.set_style("whitegrid")
    sns.set_context("paper", font_scale=1.5)
    
    # Get unique parameters
    params = df['param_name'].unique()
    
    # Metrics to plot
    metrics = [
        ('infected', 'Total Infected'),
        ('long_covid_cases', 'Long COVID Cases'),
        ('peak_infected', 'Peak Infected'),
        ('min_productivity', 'Minimum Productivity (%)')
    ]
    
    for param_name in params:
        fig, axes = plt.subplots(2, 2, figsize=(16, 12))
        fig.suptitle(f'Effect of {param_name} on COVID-19 Outcomes\n'
                    f'(Mean ± 95% CI, n={len(SEED_ARRAY)} replications)',
                    fontsize=18, fontweight='bold')
        
        param_stats = stats_df[stats_df['param_name'] == param_name]
        
        for idx, (metric_key, metric_label) in enumerate(metrics):
            ax = axes[idx // 2, idx % 2]
            
            x = param_stats['param_value'].values
            y = param_stats[f'{metric_key}_mean'].values
            yerr = param_stats[f'{metric_key}_ci95'].values
            
            # Plot with error bars
            ax.errorbar(x, y, yerr=yerr, marker='o', markersize=10,
                       linewidth=2, capsize=5, capthick=2,
                       color='steelblue', ecolor='gray', alpha=0.8)
            
            # Formatting
            ax.set_xlabel(param_name, fontsize=14, fontweight='bold')
            ax.set_ylabel(metric_label, fontsize=14, fontweight='bold')
            ax.set_title(metric_label, fontsize=15)
            ax.grid(True, alpha=0.3)
            
            # Add individual points
            param_data = df[df['param_name'] == param_name]
            for value in x:
                value_data = param_data[param_data['param_value'] == value][metric_key]
                # Jitter x slightly for visibility
                x_jitter = value + np.random.normal(0, 0.3, len(value_data))
                ax.scatter(x_jitter, value_data, alpha=0.3, s=30, color='gray')
        
        plt.tight_layout()
        plt.savefig(f'{output_prefix}_{param_name}.png', dpi=300, bbox_inches='tight')
        print(f"✓ Saved: {output_prefix}_{param_name}.png")
        plt.close()


def plot_summary_table(stats_df, output_file='publication_summary_table.png'):
    """
    Create a summary table for publication
    """
    
    # Create summary for Long COVID (most important metric)
    summary = stats_df[['param_name', 'param_value', 
                        'long_covid_cases_mean', 'long_covid_cases_ci95',
                        'infected_mean', 'infected_ci95']].copy()
    
    # Format for display
    summary['Long COVID'] = summary.apply(
        lambda row: f"{row['long_covid_cases_mean']:.0f} ± {row['long_covid_cases_ci95']:.0f}",
        axis=1
    )
    summary['Total Infected'] = summary.apply(
        lambda row: f"{row['infected_mean']:.0f} ± {row['infected_ci95']:.0f}",
        axis=1
    )
    
    # Create figure
    fig, ax = plt.subplots(figsize=(12, 8))
    ax.axis('tight')
    ax.axis('off')
    
    # Group by parameter
    for param_name in summary['param_name'].unique():
        param_data = summary[summary['param_name'] == param_name]
        
        table_data = param_data[['param_value', 'Long COVID', 'Total Infected']].values
        
        table = ax.table(cellText=table_data,
                        colLabels=['Parameter Value', 'Long COVID Cases', 'Total Infected'],
                        cellLoc='center',
                        loc='center',
                        bbox=[0, 0, 1, 1])
        
        table.auto_set_font_size(False)
        table.set_fontsize(10)
        table.scale(1, 2)
        
    plt.savefig(output_file, dpi=300, bbox_inches='tight')
    print(f"✓ Saved: {output_file}")
    plt.close()


# ============================================
# REPORTING FUNCTIONS
# ============================================

def print_publication_summary(stats_df):
    """
    Print results in publication-ready format
    """
    
    print("\n" + "="*80)
    print("PUBLICATION-READY SUMMARY")
    print("="*80)
    
    for param_name in stats_df['param_name'].unique():
        print(f"\n{'─'*80}")
        print(f"Parameter: {param_name}")
        print(f"{'─'*80}")
        
        param_stats = stats_df[stats_df['param_name'] == param_name]
        
        print(f"\n{'Value':<10} {'Infected':<25} {'Long COVID':<25} {'Peak':<20}")
        print(f"{'':<10} {'(Mean ± 95% CI)':<25} {'(Mean ± 95% CI)':<25} {'(Mean ± 95% CI)':<20}")
        print("─"*80)
        
        for _, row in param_stats.iterrows():
            value = row['param_value']
            
            infected_mean = row['infected_mean']
            infected_ci = row['infected_ci95']
            
            lc_mean = row['long_covid_cases_mean']
            lc_ci = row['long_covid_cases_ci95']
            
            peak_mean = row['peak_infected_mean']
            peak_ci = row['peak_infected_ci95']
            
            print(f"{value:<10.1f} "
                  f"{infected_mean:>8.0f} ± {infected_ci:<8.0f}    "
                  f"{lc_mean:>8.0f} ± {lc_ci:<8.0f}    "
                  f"{peak_mean:>6.0f} ± {peak_ci:<6.0f}")
    
    print("\n" + "="*80)


def generate_latex_table(stats_df, output_file='publication_table.tex'):
    """
    Generate LaTeX table for publication
    """
    
    with open(output_file, 'w') as f:
        for param_name in stats_df['param_name'].unique():
            param_stats = stats_df[stats_df['param_name'] == param_name]
            
            f.write("\\begin{table}[h]\n")
            f.write("\\centering\n")
            f.write("\\caption{Effect of " + param_name.replace('_', '\\_') + 
                   " on COVID-19 outcomes (Mean $\\pm$ 95\\% CI)}\n")
            f.write("\\begin{tabular}{l c c c}\n")
            f.write("\\hline\n")
            f.write("Parameter Value & Total Infected & Long COVID Cases & Peak Infected \\\\\n")
            f.write("\\hline\n")
            
            for _, row in param_stats.iterrows():
                value = row['param_value']
                infected = f"${row['infected_mean']:.0f} \\pm {row['infected_ci95']:.0f}$"
                lc = f"${row['long_covid_cases_mean']:.0f} \\pm {row['long_covid_cases_ci95']:.0f}$"
                peak = f"${row['peak_infected_mean']:.0f} \\pm {row['peak_infected_ci95']:.0f}$"
                
                f.write(f"{value:.1f} & {infected} & {lc} & {peak} \\\\\n")
            
            f.write("\\hline\n")
            f.write("\\end{tabular}\n")
            f.write(f"\\label{{tab:{param_name}}}\n")
            f.write("\\end{table}\n\n")
    
    print(f"✓ Saved LaTeX table: {output_file}")


# ============================================
# MAIN EXECUTION
# ============================================

def main():
    """
    Complete publication workflow:
    1. Run parameter sweep with seed arrays
    2. Calculate statistics
    3. Generate figures
    4. Generate tables
    5. Print summary
    """
    
    print("\n" + "="*80)
    print("PUBLICATION-QUALITY COVID-19 SIMULATION")
    print("="*80)
    print("This will produce:")
    print("  ✓ Raw data with uncertainty quantification")
    print("  ✓ Statistical summary (mean ± 95% CI)")
    print("  ✓ Publication-quality figures")
    print("  ✓ LaTeX tables")
    print("  ✓ Formatted results summary")
    print("="*80 + "\n")
    
    # Step 1: Run sweep
    print("STEP 1: Running parameter sweep with seed arrays...")
    df = run_publication_sweep()
    
    # Step 2: Calculate statistics
    print("\nSTEP 2: Calculating statistics...")
    stats_df = calculate_statistics(df)
    stats_df.to_csv('publication_statistics.csv', index=False)
    print("✓ Saved: publication_statistics.csv")
    
    # Step 3: Generate figures
    print("\nSTEP 3: Generating publication figures...")
    plot_publication_figures(df, stats_df)
    
    # Step 4: Generate tables
    print("\nSTEP 4: Generating publication tables...")
    generate_latex_table(stats_df)
    
    # Step 5: Print summary
    print("\nSTEP 5: Printing summary...")
    print_publication_summary(stats_df)
    
    print("\n" + "="*80)
    print("COMPLETE! All publication materials generated.")
    print("="*80)
    print("\nGenerated files:")
    print("  ✓ publication_results.csv - Raw data")
    print("  ✓ publication_statistics.csv - Statistical summary")
    print("  ✓ publication_*.png - Figures with error bars")
    print("  ✓ publication_table.tex - LaTeX tables")
    print("="*80 + "\n")
    
    return df, stats_df


# ============================================
# QUICK TEST
# ============================================

def quick_test():
    """
    Quick test with smaller parameter space
    """
    
    print("\n" + "="*80)
    print("QUICK TEST - Reduced parameter space")
    print("="*80 + "\n")
    
    # Smaller parameter sweep for testing
    test_params = {
        'covid_spread_chance_pct': [5, 10, 15],
        'vaccination_pct': [50, 80],
    }
    
    test_seeds = [42, 123, 456]  # Just 3 seeds
    
    df = run_publication_sweep(
        param_dict=test_params,
        seed_array=test_seeds,
        n_agents=10000,  # Smaller population
        output_file='test_results.csv'
    )
    
    stats_df = calculate_statistics(df)
    print_publication_summary(stats_df)
    
    return df, stats_df


if __name__ == "__main__":
    import sys
    
    if len(sys.argv) > 1 and sys.argv[1] == 'test':
        # Quick test
        quick_test()
    else:
        # Full publication sweep
        main()
