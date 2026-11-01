# Simulated Annealing over Room Visiting Orders

Issue: #3. Code: `algorithms/simulated_annealing.py`. Evaluation: `experiments/eval_simulated_annealing.py`. Tests: `tests/simulated_annealing_test.py`.

## Problem

Travel times and service times are fixed, so once the set of pending rooms is known, the only decision that changes the total cost is the order of visits. This is a travelling-salesperson-style problem: visit all 11 rooms once, starting from the gate.

- Search space: 11! = 39,916,800 orders.
- Cost of an order: the sum of shortest-path travel times between consecutive rooms, starting from the current room. Distances are precomputed with `CampusGraph.shortest_path_weight`, so a route may pass through a room without completing its step.
- Service time is the same for every order (the sum of `mean_service_time`, 64 here), so it does not affect which order is best and is left out of the objective.

## Algorithm

`SimulatedAnnealingAgent` keeps a current order and repeatedly proposes a neighbouring one.

- **Neighbours**: with equal probability, either swap two positions or remove a room and insert it at another position.
- **Acceptance**: a cheaper order is always accepted. A worse order that costs `delta` more is accepted with probability `exp(-delta / T)`.
- **Cooling**: one proposal per temperature step, starting at `initial_temp` and stopping when the temperature reaches `min_temp`.
  - `exponential`: `T <- T * cooling_rate`.
  - `linear`: `T <- T - (1 - cooling_rate) * initial_temp`.
- **Restarts**: the whole run is repeated `restarts` times from a fresh random order, and the best order seen overall is kept.
- **Seeding**: all randomness comes from `core.seeding.get_rng(seed)`, so a given seed always gives the same result.

Configurable parameters: `schedule`, `initial_temp`, `cooling_rate`, `min_temp`, `restarts`, `seed`. Invalid values raise `ValueError`.

As an agent, it plans once from the start state, then `select_action` completes the next planned room when standing in it and otherwise steps along the shortest path towards it. If the state stops matching the plan, it replans from the current room.

## Optimal ordering for comparison

`optimal_order` solves the same problem exactly with Held-Karp dynamic programming over subsets of rooms (O(2^n n^2)). For 11 rooms it takes about 19 ms. A test checks it against brute force on a 6-room subset.

The optimal travel cost from the gate is **71**:

`gate > lhtc_gate > L-206 > L-106 > L-105 > L-104 > L-103 > panini_gate > shop > office > room`

This order is not unique. More than one order ties at 71, and the annealer often finds a different one with the same cost.

## Experiment

30 fixed seeds (0 to 29), `initial_temp = 50`, `min_temp = 0.01`. Gap is `(cost - 71) / 71`. "To best" is the mean step at which the final best cost first appears.

The linear schedule is given a cooling rate chosen so that it takes the same number of steps as the exponential one in the same row group. With the same rate, linear would run far fewer steps and the comparison would be unfair.

| schedule | rate | restarts | steps | optimal found | mean gap % | worst gap % | ms | to best |
|---|---|---|---|---|---|---|---|---|
| exponential | 0.9800 | 1 | 422 | 13/30 | 6.15 | 39.44 | 6.4 | 291 |
| linear | 0.9976 | 1 | 422 | 1/30 | 22.49 | 47.89 | 6.3 | 310 |
| exponential | 0.9900 | 1 | 848 | 18/30 | 3.38 | 8.45 | 15.1 | 440 |
| linear | 0.9988 | 1 | 848 | 6/30 | 11.03 | 39.44 | 11.6 | 730 |
| exponential | 0.9950 | 1 | 1700 | 18/30 | 3.38 | 8.45 | 25.3 | 622 |
| linear | 0.9994 | 1 | 1701 | 14/30 | 4.84 | 16.90 | 22.4 | 1355 |
| exponential | 0.9800 | 5 | 2110 | 30/30 | 0.00 | 0.00 | 28.8 | 809 |
| linear | 0.9976 | 5 | 2110 | 6/30 | 7.28 | 21.13 | 31.4 | 1156 |
| exponential | 0.9900 | 5 | 4240 | 30/30 | 0.00 | 0.00 | 62.9 | 936 |
| linear | 0.9988 | 5 | 4240 | 21/30 | 2.21 | 11.27 | 59.1 | 2196 |
| exponential | 0.9950 | 5 | 8500 | 30/30 | 0.00 | 0.00 | 148.5 | 1665 |
| linear | 0.9994 | 5 | 8505 | 29/30 | 0.09 | 2.82 | 127.5 | 2944 |

Steps are the total over all restarts.

## Findings

- **Exponential beats linear at equal budgets.** In every row group exponential finds the optimum more often. Linear cooling spends most of its steps at high temperature, where the search wanders almost randomly, and only a short stretch at low temperature, where it refines a solution. Exponential spends proportionally more steps at low temperatures.
- **Restarts matter more than slower cooling.** With one restart, doubling the steps from 848 to 1700 did not change the result for exponential (18/30 both times). Five restarts at the fastest rate (2,110 steps, 29 ms) found the optimum on all 30 seeds, which one slow run (1,700 steps) could not. A single run can get trapped in a local minimum, and independent starts avoid that.
- **Convergence.** The exponential schedule reaches its best cost after roughly 20 to 70 percent of the steps, depending on the row. Linear reaches it late, for example step 1,355 of 1,701 at one restart (about 80 percent), because it only finds good orders once the temperature is low.
- **Runtime** grows linearly with the number of steps, at about 15 microseconds per step in this implementation.
- **Recommended defaults**: exponential, `cooling_rate = 0.995`, `restarts = 5`. These are the class defaults. They found the optimum on all 30 seeds.

## Comparison with the exact solution

With the defaults, the annealer matches the optimal travel cost of 71 on every tested seed. Run through `CampusSimulator`, the plan gives travel 71, wait 11, service 64, total 146, the same total the value iteration agent (issue #4) reaches.

For this map the exact solver is the better tool: 19 ms against 29 ms for the cheapest setting that was reliably optimal. Annealing becomes useful when there are too many rooms for the exact solver, whose time and memory grow as 2^n. Here it serves as the local-search baseline the issue asks for.

## Limitations

- The simulator charges a fixed one tick of wait per step, so the objective ignores queueing. Order only matters through travel here. A model that includes congestion belongs to the MDP agent.
- The plan is built when the agent first acts, and again only if the state stops matching it.
- Rooms passed on the way to the next target are not completed opportunistically.

## Reproduce

```
python3 -m pytest tests/simulated_annealing_test.py -v
python3 -m experiments.eval_simulated_annealing
```
