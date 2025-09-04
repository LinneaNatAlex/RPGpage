// imports the necessary modules and components.
import styles from "./Rpg.module.css";
const Rpg = () => {
  return (
    //  simple HTML structure for the RPG rules page
    <div className={styles.classRooms}>
      <div className={styles.RpgRulesContainer}>
        <div className={styles.RpgRules}>
          <h1>RPG Gaming Rules</h1>
          <p>
            How Roleplay Works – The Starshade Hall RPG Guide. Welcome to the
            mystical world of Veyloria Arcane School! This is a text-based
            roleplaying game (RPG) where you take on the role of a student at a
            magical school for werewolves, witches, vampires, and fairies. For
            now, we use the live chat called Starshade Hall as our shared space
            for all in-character roleplay.
          </p>
          <br />
          <h2>What is Roleplay (RPG)?</h2>
          <p>
            Roleplay means writing as your character—imagining how they think,
            feel, speak, and act in the world of Veyloria Arcane School. You’ll
            interact with other characters, build relationships, and create your
            own story, all through writing. Each player controls one or more
            original student characters (OCs) from the magical races:
            werewolves, witches, vampires, or fairies. You decide their name,
            race, personality, and history.
          </p>
          <h2>Where Do We Play?</h2>
          <p>
            For now, all main roleplay happens in the live chat room called
            Starshade Hall. This is an open IC (in-character) space where all
            students can talk, meet, and play together in real time.
          </p>
          <h2>How to Roleplay in the Grand Hall</h2>
          <strong>Always stay in-character </strong>You're a student at Veyloria
          Arcane School. Type your messages as if you're speaking or acting in
          the magical world. Example: Mira glides into Starshade Hall, her cloak
          shimmering. "Did anyone else sense the full moon's magic last night?"
          <br />
          <strong>Use simple action formatting</strong> You can describe actions
          using third person, past tense, like writing a story. Quotation marks
          are used for speech. Good: Alex sat down at the werewolf table and
          grinned. "I hope today’s breakfast has moonberry pie." Avoid: "I sit
          down and say 'hello'" or *sits and waves*
          <br />
          <strong>Avoid OOC (Out-of-Character)</strong> talk in Starshade Hall.
          If you must say something as yourself, use double brackets like this:
          ((brb – dinner time)) But keep OOC talk to a minimum.
          <br />
          <strong>Respect the setting</strong>
          <br />
          <br />
          1. Starshade Hall is a large, be respectful and give others a chance
          to reply.
          <br /> 2. Don’t make your character too perfect or powerful. <br />
          3. Let scenes develop naturally – don’t try to control the whole
          story. <br /> 4. Read the mood of the room – if a serious scene is
          happening, don’t interrupt with silly actions. <br /> 5. What Not to
          Do No godmodding (controlling other characters without permission){" "}
          <br /> 6. No metagaming (using OOC knowledge IC) <br /> 7. No extreme
          violence, adult content, or disruptive behavior <br /> 8. No spamming
          or overly short one-liners like “walks in hi”
          <br />
          <br />
          <strong>Just Getting Started?</strong> Introduce your character in the
          chat by describing how they enter or join the conversation. You don’t
          need to wait for permission – just jump in. If you're unsure, watch
          how others write, or ask a mod for help ((in OOC brackets)).
        </div>
      </div>
    </div>
  );
};

export default Rpg;
