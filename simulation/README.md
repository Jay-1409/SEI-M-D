# Simulation Workspace

This folder contains all planning, specs, assets, and demo code for the expo simulations of the Secure Microservice Deployer project.

## Absolute Rules

- Do not modify the main project code or folders.
- Only add, edit, or delete files inside `simulation`.
- Treat the main project as read-only reference material.
- If a simulation needs data or behavior inspired by the main project, recreate or simulate it inside this folder.

## Purpose

The goal of this workspace is to create visitor-friendly expo demos that explain:
- what the software does,
- why it matters,
- what risks it solves,
- how the protections work,
- and how to present them clearly to layman visitors.

## Core Strategy

The work is split into two categories:

1. Custom simulations
These are simple, story-driven demos built inside `simulation` so layman visitors can understand attack and protection concepts.

Current custom simulation targets:
- SQL injection
- XSS
- Rate limiting
- API key protection

2. Real-platform demo guides
These are polished demo scripts for showing the existing project UI and functionality without changing the main project.

Current real-platform demo targets:
- image upload and inspection
- deployment and gateway access
- Trivy scan
- Nikto scan
- OpenAPI detection
- service control flows
- WAF logs and statistics

## Important Files

- [index.html](C:\Users\ARTH PATEL\OneDrive\Desktop\ARTH\Sem-6\Cyber\Project\SEI-M-D\simulation\index.html)
  Shared launcher page for opening the built demos, real-platform guides, and presenter docs from one place.

- [FUNCTIONALITY_SIMULATION_PLAN.md](C:\Users\ARTH PATEL\OneDrive\Desktop\ARTH\Sem-6\Cyber\Project\SEI-M-D\simulation\FUNCTIONALITY_SIMULATION_PLAN.md)
  High-level mapping from project functionality to expo-friendly simulation ideas.

- [SIMULATION_TASK_LIST.md](C:\Users\ARTH PATEL\OneDrive\Desktop\ARTH\Sem-6\Cyber\Project\SEI-M-D\simulation\SIMULATION_TASK_LIST.md)
  Main execution checklist with numbered tasks and subtasks.

- [SIMULATION_ROADMAP.md](C:\Users\ARTH PATEL\OneDrive\Desktop\ARTH\Sem-6\Cyber\Project\SEI-M-D\simulation\SIMULATION_ROADMAP.md)
  Ordered roadmap with priorities, demo types, and status.

- [DECISIONS.md](C:\Users\ARTH PATEL\OneDrive\Desktop\ARTH\Sem-6\Cyber\Project\SEI-M-D\simulation\DECISIONS.md)
  Records of design choices and assumptions.

- [HANDOFF.md](C:\Users\ARTH PATEL\OneDrive\Desktop\ARTH\Sem-6\Cyber\Project\SEI-M-D\simulation\HANDOFF.md)
  Current status, next steps, and handoff notes for future chats or agents.

- [STATUS.md](C:\Users\ARTH PATEL\OneDrive\Desktop\ARTH\Sem-6\Cyber\Project\SEI-M-D\simulation\STATUS.md)
  Lightweight snapshot of what is complete, what is active, and what should happen next.

- [PRESENTER_PLAYBOOK.md](C:\Users\ARTH PATEL\OneDrive\Desktop\ARTH\Sem-6\Cyber\Project\SEI-M-D\simulation\PRESENTER_PLAYBOOK.md)
  Short intro, per-demo explanations, full route, fast route, and likely Q&A for expo presenters.

- [EXPO_SETUP_AND_RESET_GUIDE.md](C:\Users\ARTH PATEL\OneDrive\Desktop\ARTH\Sem-6\Cyber\Project\SEI-M-D\simulation\EXPO_SETUP_AND_RESET_GUIDE.md)
  Simple runbook for pre-expo setup, start-of-day checks, resets, troubleshooting, and fallback use.

- [RUN_DEMOS.md](C:\Users\ARTH PATEL\OneDrive\Desktop\ARTH\Sem-6\Cyber\Project\SEI-M-D\simulation\RUN_DEMOS.md)
  Single source of truth for how to open every completed demo, how to reset it between visitors, and what order to present it in during the expo.

## Suggested Folder Structure

- `specs/`
  Detailed design specs for each custom simulation and each real-platform demo guide.

- `demos/`
  Built simulation apps or demo pages.

- `assets/`
  Shared images, icons, screenshots, and text content.

- `scripts/`
  Optional helper scripts for launching or resetting demo content inside the simulation workspace.

## How To Continue In A New Chat

1. Read [README.md](C:\Users\ARTH PATEL\OneDrive\Desktop\ARTH\Sem-6\Cyber\Project\SEI-M-D\simulation\README.md)
2. Read [HANDOFF.md](C:\Users\ARTH PATEL\OneDrive\Desktop\ARTH\Sem-6\Cyber\Project\SEI-M-D\simulation\HANDOFF.md)
3. Read [DECISIONS.md](C:\Users\ARTH PATEL\OneDrive\Desktop\ARTH\Sem-6\Cyber\Project\SEI-M-D\simulation\DECISIONS.md)
4. Read [STATUS.md](C:\Users\ARTH PATEL\OneDrive\Desktop\ARTH\Sem-6\Cyber\Project\SEI-M-D\simulation\STATUS.md)
5. Check [SIMULATION_TASK_LIST.md](C:\Users\ARTH PATEL\OneDrive\Desktop\ARTH\Sem-6\Cyber\Project\SEI-M-D\simulation\SIMULATION_TASK_LIST.md) for the next pending task
6. Work only inside `simulation`

## Working Style

- Spec before build
- Simple language over technical jargon
- Clear before/after demonstrations
- Every simulation should end with visible proof
- Prefer familiar stories like login pages, feedback forms, ticket booking, and staff-only access
