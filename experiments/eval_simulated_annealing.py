import time

import numpy as np

from algorithms.simulated_annealing import SimulatedAnnealingAgent, optimal_order
from core.problem import CampusProblem
from envi.simulator import CampusSimulator

SEEDS = range(30)
INITIAL_TEMP = 50.0
MIN_TEMP = 0.01


def matched_linear_rate(steps):
    return 1 - (INITIAL_TEMP - MIN_TEMP) / (steps * INITIAL_TEMP)


def run(problem, rooms, optimum, **settings):
    costs, seconds, to_best = [], [], []
    for seed in SEEDS:
        agent = SimulatedAnnealingAgent(problem, seed=seed, **settings)
        begin = time.perf_counter()
        _, cost = agent.anneal("gate", rooms)
        seconds.append(time.perf_counter() - begin)
        costs.append(cost)
        to_best.append(agent.trace.index(cost) + 1)
    steps = len(agent.trace)
    gaps = [(c - optimum) / optimum * 100 for c in costs]
    return {
        "steps": steps,
        "hits": sum(c == optimum for c in costs),
        "mean_gap": float(np.mean(gaps)),
        "worst_gap": float(max(gaps)),
        "ms": float(np.mean(seconds)) * 1000,
        "to_best": float(np.mean(to_best)),
    }


def main():
    simulator = CampusSimulator("data/campus_map.json", "data/steps.json", seed=42)
    problem = CampusProblem(simulator.graph, simulator.steps_config)
    rooms = sorted(problem.steps_config)

    probe = SimulatedAnnealingAgent(problem)
    begin = time.perf_counter()
    order, optimum = optimal_order(probe.dist, "gate", rooms)
    exact_ms = (time.perf_counter() - begin) * 1000
    print(f"optimal travel cost: {optimum:.0f} (Held-Karp, {exact_ms:.0f} ms)")
    print(f"optimal order: {' > '.join(order)}")
    print(f"{len(SEEDS)} seeds, initial_temp={INITIAL_TEMP}, min_temp={MIN_TEMP}\n")

    header = f"{'schedule':<12}{'rate':>7}{'restarts':>9}{'steps':>7}{'optimal':>9}{'gap%':>7}{'worst%':>8}{'ms':>8}{'to best':>9}"
    print(header)
    for restarts in (1, 5):
        for rate in (0.98, 0.99, 0.995):
            exp_settings = dict(schedule="exponential", cooling_rate=rate, restarts=restarts,
                                initial_temp=INITIAL_TEMP, min_temp=MIN_TEMP)
            exp = run(problem, rooms, optimum, **exp_settings)
            per_restart = exp["steps"] // restarts
            lin_settings = dict(exp_settings, schedule="linear", cooling_rate=matched_linear_rate(per_restart))
            lin = run(problem, rooms, optimum, **lin_settings)
            for name, shown_rate, r in (("exponential", rate, exp), ("linear", lin_settings["cooling_rate"], lin)):
                print(f"{name:<12}{shown_rate:>7.4f}{restarts:>9}{r['steps']:>7}{r['hits']:>7}/30"
                      f"{r['mean_gap']:>7.2f}{r['worst_gap']:>8.2f}{r['ms']:>8.1f}{r['to_best']:>9.0f}")


if __name__ == "__main__":
    main()
  
