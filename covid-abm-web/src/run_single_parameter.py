#!/usr/bin/env python3
"""
Run simulations for a single parameter value
Used by GitHub Actions for parallel execution
"""

import argparse
import pandas as pd
import sys
from covid_abm_model import FixedGPUABM

def main():
    parser = argparse.ArgumentParser(description='Run COVID ABM for single parameter value')
    parser.add_argument('--parameter', type=str, required=True,
                        help='Parameter name to vary')
    parser.add_argument('--value', type=float, required=True,
                        help='Parameter value to test')
    parser.add_argument('--n_runs', type=int, default=10,
                        help='Number of simulation runs')
    parser.add_argument('--n_agents', type=int, default=100000,
                        help='Number of agents per simulation')
    parser.add_argument('--output', type=str, required=True,
                        help='Output CSV file path')
    
    args = parser.parse_args()
    
    print(f"\n{'='*70}")
    print(f"PARAMETER SWEEP - Single Value")
    print(f"{'='*70}")
    print(f"Parameter:    {args.parameter}")
    print(f"Value:        {args.value}")
    print(f"Runs:         {args.n_runs}")
    print(f"Agents:       {args.n_agents:,}")
    print(f"Output:       {args.output}")
    print(f"{'='*70}\n")
    
    results = []
    
    for run in range(args.n_runs):
        print(f"\nRun {run + 1}/{args.n_runs}...")
        
        try:
            # Initialize model
            abm = FixedGPUABM()
            abm.initialize_simulation(
                N=args.n_agents,
                seed=42 + run,
                **{args.parameter: args.value}
            )
            
            # Run simulation
            metrics = abm.run_simulation(verbose=False)
            
            # Add metadata
            metrics['param_name'] = args.parameter
            metrics['param_value'] = args.value
            metrics['run'] = run
            metrics['agents'] = args.n_agents
            
            results.append(metrics)
            
            print(f"✓ Complete: {metrics['infected']:,} infected, "
                  f"{metrics['long_covid_cases']:,} LC cases")
            
            # Clean up
            del abm
            
        except Exception as e:
            print(f"✗ Error in run {run}: {e}")
            sys.exit(1)
    
    # Save results
    df = pd.DataFrame(results)
    df.to_csv(args.output, index=False)
    
    print(f"\n{'='*70}")
    print(f"✓ Results saved to {args.output}")
    print(f"{'='*70}\n")
    
    # Print summary statistics
    print("Summary Statistics:")
    print(f"  Mean infected:        {df['infected'].mean():,.0f}")
    print(f"  Mean reinfected:      {df['reinfected'].mean():,.0f}")
    print(f"  Mean Long COVID:      {df['long_covid_cases'].mean():,.0f}")
    print(f"  Mean min productivity: {df['min_productivity'].mean():.2f}%")
    print()

if __name__ == "__main__":
    main()