import styles from "./ClassRooms.module.css";
const ClassRooms = () => {
  // Rules page set, only className and simple html to show the rules of the page.
  return (
    <div className={styles.classRooms}>
      <div className={styles.classromRulesContainer}>
        <div className={styles.classroomsRules}>
          <h1>
            Veyloria Arcane School Classrooms – Information & Roleplay Rules
          </h1>
          <p>
            The classrooms at Veyloria Arcane School serve two main purposes:{" "}
            <br />
            <br />
            1. To provide in-character (IC) mystical knowledge for students of
            all magical races—werewolves, witches, vampires, and fairies.
            <br />
            2. To offer structured spaces for optional roleplay lessons guided
            by professors or open participation.
            <br />
            <br />
          </p>
          <br />
          <h2>What You’ll Find in Classrooms</h2>
          <p>
            Lesson threads for subjects like Alchemy, Enchantments, Herbal Lore,
            and Transformation. Information posts explaining spells, magical
            creatures, plants, potion recipes, rituals, and safety rules.
            Homework prompts (optional), useful for character development. Notes
            and study guides written IC, meant to help your character grow over
            time.
          </p>
          <h2>Classroom Knowledge Rules</h2>
          <p>
            1. Year-Based Knowledge Access
            <br />
            1. First Years: Basic mystical skills (e.g., Moonlight Charm,
            Healing Brew), beginner rituals, very limited magical theory. Cannot
            perform advanced magic, complex transformations, or dangerous
            spells.
            <br />
            <br />
            2. Second to Third Years: Intermediate spells (e.g., Shadow Veil,
            Nature’s Whisper), beginner transformation, more potion ingredients
            and effects. Still no advanced spellwork, dangerous hexes, or major
            enchantments.
            <br />
            <br />
            3. Fourth to Fifth Years: May begin using shield spells, basic
            nonverbal magic (with justification), more complex potion work, and
            deeper mystical theory. Limited use of magical creatures or risky
            magic.
            <br />
            <br />
            4. Sixth to Seventh Years: Access to advanced magic (e.g., nonverbal
            spells, powerful rituals), complex transformations, and rare magical
            knowledge. Must be justified in roleplay.
            <br />
            casting, more difficult potions like Felix Felicis), use of
            dangerous creatures and enchanted objects — but only with reason and
            control. Must demonstrate experience through previous RP or lessons.
          </p>
          <h2>General Rules for Using Classroom Info in RP</h2>
          <strong>
            1. Don’t use spells or potions your character wouldn’t realistically
            know yet.
          </strong>
          <br />
          Just because you read about it doesn’t mean your character has learned
          or mastered it.
          <br />
          <br />
          <strong>2.Reference learning moments in RP.</strong>
          <br />
          For example: "After the last Charms class, Emily had practiced the
          Summoning Charm five times before finally getting her quill to fly
          into her hand."
          <br />
          <br />
          <strong>3.No sudden mastery.</strong>
          <br />
          Learning magic takes time. If your character learns something new,
          show them trying, failing, and improving over multiple scenes.
        </div>
      </div>
    </div>
  );
};
// Exports the classrooms page

export default ClassRooms;
