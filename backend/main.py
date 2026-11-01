import json
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from envi.simulator import CampusSimulator
from core.problem import CampusProblem

from agents.q_learning_agent import QLearningAgent
from algorithms.bfs import BFSAgent
from algorithms.dfs import DFSAgent
from algorithms.greedy_nearest import GreedyNearestAgent
from algorithms.ids import IDSAgent
from algorithms.astar import AStarAgent
from algorithms.ucs import UCSAgent
from algorithms.value_iteration import ValueIterationAgent
from algorithms.simulated_annealing import SimulatedAnnealingAgent

app = FastAPI(title="Campus Saathi API", version="1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/api/map")
def get_campus_map():
    """Returns the campus nodes and edges layout from JSON."""
    try:
        with open("data/campus_map.json", "r") as f:
            return json.load(f)
    except FileNotFoundError:
        return {"error": "campus_map.json not found in data directory."}

@app.get("/api/simulate/{agent_type}")
def run_simulation_api(agent_type: str):
    """
    Runs a simulation episode for the specified agent type 
    and returns the step-by-step trace.
    """
    simulator = CampusSimulator("data/campus_map.json", "data/steps.json", seed=42)
    problem = CampusProblem(simulator.graph, steps_config=simulator.steps_config)

    agent_key = agent_type.lower()

    if agent_key == "q_learning":
        agent = QLearningAgent(problem)
        # in full pipeline we have to load pre-trained Q-weights here
    elif agent_key == "a_star":
        agent = AStarAgent(problem)
    elif agent_key == "ucs":
        agent = UCSAgent(problem)
    elif agent_key == "value_iteration":
        agent = ValueIterationAgent(problem)
    elif agent_key == "simulated_annealing":
        agent = SimulatedAnnealingAgent(problem)
    elif agent_key == "bfs":
        agent = BFSAgent(problem)
    elif agent_key == "dfs":
        agent = DFSAgent(problem)
    elif agent_key == "greedy_nearest":
        agent = GreedyNearestAgent(problem)
    elif agent_key == "ids":
        agent = IDSAgent(problem)
    else:
        return {"error": f"Agent type '{agent_type}' not supported yet. Choose from q_learning, a_star, ucs, value_iteration, simulated_annealing."}

    return simulator.run_simulation(agent, max_steps=500)

    # OLD MANUAL LOOP
    # state = problem.initial_state()
    # trace = []
    # current_room ,completed_steps = state
    # step_count = 0
    # max_steps = 100

    # travel_time = 0.0
    # wait_time = 0.0
    # service_time = 0.0

    # while step_count < max_steps:
    #     step_count += 1

    #     try:
    #         action = agent.select_action((current_room, completed_steps),metrics=None)
    #     except TypeError:
    #         try:
    #             action = agent.select_action((current_room, completed_steps))
    #         except Exception:
    #             action = None
    #     if not action:
    #         legal_actions = problem.actions((current_room, completed_steps))
    #         if legal_actions:
    #             action = legal_actions[0]
    #         else:
    #             break

    #     action_type, target = action
    #     if action_type == "move":
    #         neighbors = problem.graph.get_neighbors(current_room)
    #         weight = neighbors.get(target, 1.0)
    #         travel_time += float(weight)
    #         current_room = target
    #     else:
    #         wait_time += 1.0
    #         service = float(problem.steps_config.get(target, {}).get("mean_service_time", 3.0))
    #         service_time += service
    #         completed_steps = frozenset(list(completed_steps) + [target])

    #     trace.append({
    #         "step": step_count,
    #         "current_room": current_room,
    #         "completed_steps": list(completed_steps),
    #         "action_taken": [action_type, target]
    #     })

    #     if problem.goal_test((current_room, completed_steps)):
    #         break
    
    # total_cost = travel_time + wait_time + service_time
    # return {
    #     "agent": agent_type,
    #     "total_steps": step_count,
    #     "metrics": {
    #         "travel_time": travel_time,
    #         "wait_time": wait_time,
    #         "service_time": service_time,
    #         "total_cost": total_cost
    #     },
    #     "trace": trace
    # }