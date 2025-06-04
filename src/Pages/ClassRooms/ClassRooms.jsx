import styles from "./ClassRooms.module.css";
const ClassRooms = () => {
  // Rules page set, only className and simple html to show the rules of the page.
  return (
    <div className={styles.classRooms}>
      <div className={styles.classromRulesContainer}>
        <div className={styles.classroomsRules}>
          <h1>Hogwarts Classrooms – Information & Roleplay Rules</h1>
          <p>
            The classrooms on this site serve two main purposes: <br />
            <br />
            1. To provide in-character (IC) magical knowledge that students can
            learn and refer to.
            <br />
            2. To offer structured spaces for optional roleplay lessons guided
            by professors or open participation.
            <br />
            <br />
          </p>
          <br />
          <h2>What You’ll Find in Classrooms</h2>
          <p>
            Lesson threads for subjects like Potions, Charms, Herbology, and
            Transfiguration Information posts explaining spells, magical
            creatures, plants, potion recipes, wand movements, and safety rules
            Homework prompts (optional), useful for character development. Notes
            and study guides written IC, meant to help your character grow over
            time
          </p>
          <h2>Classroom Knowledge Rules</h2>
          <p>
            1. Year-Based Knowledge Access 1. First Years Basic spellcasting
            (e.g., Lumos, Wingardium Leviosa), beginner potions (e.g., Cure for
            Boils), very limited magical theory. Cannot perform nonverbal magic,
            complex dueling, or dangerous spells.
            <br />
            <br />
            2. Second to Third Years Intermediate spells (e.g., Expelliarmus,
            Rictusempra), beginner transfiguration, more potion ingredients and
            effects. Still no advanced spellwork, dangerous hexes, or major
            enchantments.
            <br />
            <br />
            3. Fourth to Fifth Years May begin using shield spells, basic
            nonverbal magic (with justification), more complex potion work, and
            deeper magical theory. Limited use of magical creatures or risky
            magic.
            <br />
            <br />
            4. Sixth to Seventh Years Access to advanced magic (e.g., nonverbal
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
