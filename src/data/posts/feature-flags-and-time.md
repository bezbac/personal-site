---
title: Feature Flags and Time - Lessons from a Production Incident
description: Reflecting on an incident and how feature flags can create unexpected challenges when time is a factor.
published: 2025-05-08T09:40:00+02:00
keywords: [feature flag, distributed system, consistency, temporal coupling]
---

Feature flags are often seen as simple on/off switches, but when time becomes a factor, unexpected complexities can arise. I recently encountered this firsthand during a minor production incident at work.

## The Incident

A few days ago, just as I was about to leave work, a bug report came in: users couldn't join workspaces they were invited to. Only after the invite was deleted and the account owner created a new invite could the user successfully join the account. Not a catastrophic outage, but definitely a frustrating first impression for our customers.

## The Investigation

Last week, our team deployed an enhanced user invitation flow. The new system sent invitation emails with updated links, directing users through a revamped signup experience.

After digging through the logs and the code I identified the cause of the production issue.  
I gathered that a feature flag was supposed to be evaluated at two critical points:

1. When creating and sending the invitation.
2. When processing the invite after the user clicked the link.

The flag was supposed to remain off system-wide. However, a bug caused the flag to be misinterpreted during invite creation, resulting in new-style invite emails being sent. These emails later caused issues when users tried to accept them.

The immediate fix was straightforward: correct the flag evaluation logic. However, the deeper issue lay in the architecture. By evaluating the flag at multiple steps, we introduced a fragile temporal coupling — a design flaw that made the system vulnerable to inconsistencies over time.

The downstream code handling invite acceptance was fundamentally flawed. Evaluating the feature flag at multiple points created a temporal mismatch, leading to potential inconsistencies in scenarios such as:

- Bugs causing inconsistent flag evaluation (as in our case).
- Flag state changes while pending invitations still exist.
- Gradual rollouts where users experience different flag states.

## Better Approaches

After addressing the immediate issue, I reflected on how to avoid this class of problems entirely. Here are three approaches I find effective:

### 1. Persist Decisions in Data

Instead of re-evaluating feature flags at each step, encode the decision in the data itself. For example, include a version or flag state in the invitation payload. This ensures downstream processes handle the data consistently, regardless of the current flag state.

### 2. Use Separate Flags for Each Step

For multi-step processes, use distinct flags for each step. This allows downstream processing to be enabled first, ensuring compatibility before rolling out upstream changes.

### 3. Avoid Feature Flagging Downstream Code

If possible, handle in-flight events uniformly. The simplest solution is to flag only the upstream process. Ensure the downstream code is fully compatible before enabling the upstream flag.

## Conclusion

This incident was a reminder that time complicates even seemingly simple mechanisms like feature flags. When processes span time — minutes, hours, or days — consistency becomes critical. By designing systems that account for temporal factors, we can build more robust and predictable architectures.
