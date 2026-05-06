### The Core Logic Flow

1. **Request:** User sends `{ "project_name": "Draw a Manga", "category": "Art" }`.
2. **Validation:** `models.py` checks if the data is formatted correctly.
3. **The Atomizer:** `ai_helper.py` sends a "System Prompt" to Gemini. It tells the AI: *"You are an ADHD-friendly productivity coach. Break this into 10 steps of 15 minutes each."*
4. **Parsing:** The Python backend receives the AI's long-winded text, strips it down to a clean JSON array, and sends it back to your React frontend.
5. **Gamification:** Every time a task is marked "done," a small function in `rewards.py` calculates XP based on the time spent.



## 1. The Relay Race: How the Programs Connect

### Phase A: The Request (The Entry Point)

When a user types "Write a Sci-Fi Short Story" on your React frontend, it hits  **`main.py`** .

* The **`create_roadmap`** function receives a **`ProjectRequest`** (containing `project_name` and `category`).
* `main.py` then calls the **`AtomizerAI`** class.

### Phase B: The Brain (AI Logic)

The **`AtomizerAI`** class is the "Creative Director."

* It uses **`_build_prompt()`** to create a strict instruction set for Gemini.
* After calling the API via  **`_call_ai_api()`** , it gets a messy string back.
* **`_parse_ai_response()`** cleans that mess into a clean Python list of 10 tasks.

### Phase C: The Map Maker (Visualization)

Now we have 10 tasks, but they don't look like a "roadmap" yet. **`main.py`** hands that list to the  **`RoadmapEngine`** .

* **`construct_visual_path()`** takes the strings and turns them into a list of **`RoadmapNode`** objects.
* It uses **`_calculate_node_position()`** to give each node a `position_index` (so they zigzag on the screen).
* It sets the first node to `is_locked = False` and the rest to `True`, creating the progression feel.
* Finally, it packages everything into a **`ProjectRoadmap`** object and sends it back to the user's phone.

### Phase D: The Reward (Gamification)

When the user finishes a task:

* Frontend sends a **`RewardUpdate`** to the **`/complete-task`** route.
* The **`ProgressEngine`** calculates the reward using **`calculate_xp()`** (multiplying `session_minutes` by `xp_multiplier`).
* If the user finished the whole project, **`generate_certificate_data()`** is triggered to create their "Big Win" moment.

---

## 2. A Relatable Real-Life Scenario: "The IKEA Closet"

Imagine you want to build a massive, intimidating wardrobe (Your  **Project** ), but you have ADHD and are currently staring at the box in a state of paralysis.

1. **The Intake (`ProjectRequest`):** You tell a professional organizer (The  **Breadcrumber App** ), "I need to build this 'Kallax' wardrobe."
2. **The Atomizer (`AtomizerAI`):** The organizer doesn't say "Go build it." They look at the manual and think: *"Okay, first we just need to find the screwdriver. Then, we just put two screws in the base."* They break the scary 5-hour job into 10 tiny, 15-minute "Breadcrumbs."
3. **The Roadmap (`RoadmapEngine`):** The organizer lays out 10 physical envelopes on your floor in a winding path.
   * **Node 1:** Open the box (Unlocked).
   * **Node 2:** Count the screws (Locked).
   * **Node 10:** Hang your first shirt (The "Finish" Node).
4. **The Session (`RewardUpdate`):** You set a timer for 15 minutes. You open the box.
5. **The Reward (`ProgressEngine`):** As soon as the box is open, the organizer hands you a literal gold star (XP). Because you did it without getting distracted ( **`is_pomodoro_complete`** ), they give you a bonus star.
6. **The Win (`generate_certificate_data`):** Once that shirt is hanging in Node 10, the organizer hands you a framed "Master Builder" certificate. You didn't just "build a closet"—you ate 10 breadcrumbs, and it felt easy.

---

## 3. Data Flow Summary

| **Component**          | **Responsibility** | **Key Variable/Model**         |
| ---------------------------- | ------------------------ | ------------------------------------ |
| **`main.py`**        | The Receptionist         | `app.post("/atomize")`             |
| **`models.py`**      | The Rulebook             | `RoadmapNode`,`ProjectRoadmap`   |
| **`AtomizerAI`**     | The Strategist           | `self.model`(Gemini),`raw_text`  |
| **`RoadmapEngine`**  | The Artist               | `position_index`,`node_type`     |
| **`ProgressEngine`** | The Cheerleader          | `xp_multiplier`,`current_streak` |

Does this flow make sense, or would you like to dive into the **Real Logic (Step 4)** of how we actually write that AI prompt to ensure the tasks stay "tiny"?
