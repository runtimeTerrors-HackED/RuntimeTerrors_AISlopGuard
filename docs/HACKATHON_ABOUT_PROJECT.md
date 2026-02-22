# RuntimeTerrors_AISlopGuard - About Project

## Inspiration

We built RuntimeTerrors_AISlopGuard because social feeds are getting harder to trust. AI-generated videos and images now look very real, and most users do not have a fast way to judge authenticity.  
Our goal was to build something practical: a tool that gives quick detection, explains why it made the decision, and improves over time based on user feedback.

---

## What it does

RuntimeTerrors_AISlopGuard scans a social media content URL and predicts whether the content is:

- `likely_ai`
- `unclear`
- `likely_human`

It combines platform signals, community signals, and model inference, then shows:

- final verdict
- confidence band
- evidence messages
- raw model score vs personalized model score

It also supports personalization:

- global bias (applies to all future scans)
- creator bias (applies to all future scans from that creator)

So the system becomes better aligned with the user's correction patterns over time.

---

## How we built it

We built a full-stack system:

- **Mobile app:** React Native + Expo
- **Backend API:** FastAPI
- **Model inference service:** Python service
- **State management:** Zustand
- **Persistence:** AsyncStorage
- **Data layer:** React Query + fetch

The final score is computed as:

$$
S = 0.30P + 0.50C + 0.20M_p
$$

Where:

- \(S\) = final score  
- \(P\) = platform score  
- \(C\) = community score  
- \(M_p\) = personalized model score

Personalized model score:

$$
M_p = \mathrm{clip}\left(M_{\text{raw}} + b_g + b_c,\ 0,\ 1\right)
$$

Where:

- \(M_{\text{raw}}\) = raw model score
- \(b_g\) = global bias
- \(b_c\) = creator bias

Verdict thresholds:

$$
\text{Conservative mode: }
\begin{cases}
\text{likely\_ai}, & S \ge 0.70 \\
\text{unclear}, & 0.50 \le S < 0.70 \\
\text{likely\_human}, & S < 0.50
\end{cases}
$$

$$
\text{Non-conservative mode: }
\begin{cases}
\text{likely\_ai}, & S \ge 0.75 \\
\text{unclear}, & 0.55 \le S < 0.75 \\
\text{likely\_human}, & S < 0.55
\end{cases}
$$

Bias updates for corrective feedback:

$$
b_g \leftarrow b_g + 0.02d
$$

$$
b_c \leftarrow b_c + 0.10d
$$

Direction term:

$$
d =
\begin{cases}
+1, & \text{if user votes AI and model predicted Human} \\
-1, & \text{if user votes Human and model predicted AI} \\
0, & \text{otherwise}
\end{cases}
$$

---

## Challenges we ran into

- Keeping backend verdict logic and mobile personalization verdict logic perfectly aligned.
- Separating personalization voting from community voting so they do not interfere.
- Handling creator-bias edge cases (same creator, different content, app restarts, deletion/reset).
- Building transparent UI for explainability without making the interface noisy.
- Handling local dev network issues (LAN IP changes causing mobile request failures).

---

## Accomplishments that we're proud of

- Built a complete working product, not just a model notebook demo.
- Added explainable evidence and score transparency instead of a black-box result.
- Implemented creator-level and global personalization that persists and evolves with feedback.
- Added creator-bias management tools and rich scan history details in the app.
- Stabilized tricky edge cases in bias updates and feedback flows.

---

## What we learned

- Explainability is essential for trust in real-world AI products.
- Multi-signal scoring is more robust than relying only on model output.
- Product reliability depends heavily on state design and UX flow, not only model quality.
- Small threshold mismatches across services can cause major behavior inconsistencies.
- Iterative user testing is critical for making AI-assisted decisions usable and fair.

---

## What's next for RuntimeTerrors_AISlopGuard

- Add optional cloud sync for personalization across devices.
- Improve creator identity resolution across platforms.
- Add stronger abuse/noise resistance for user feedback inputs.
- Expand model evaluation with broader real-world datasets.
- Build lightweight moderation analytics for teams and creators.
- Improve calibration and confidence reporting for more precise decision boundaries.
