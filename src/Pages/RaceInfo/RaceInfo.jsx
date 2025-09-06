import React from "react";
import { raceDescriptions } from "../../Components/SortingQuiz/raceDescriptions";
import styles from "./RaceInfo.module.css";
import { useParams, Link } from "react-router-dom";

const RaceInfo = () => {
  const { race } = useParams();
  const info =
    raceDescriptions[race?.charAt(0).toUpperCase() + race?.slice(1)] || null;

  if (!info) {
    return (
      <div className={styles.infoContainer}>
        <h2>Fant ikke informasjon om denne rasen.</h2>
        <Link to="/sign-up">Tilbake til registrering</Link>
      </div>
    );
  }

  return (
    <div className={styles.infoContainer}>
      <h2>{info.title}</h2>
      <p>{info.description}</p>
      <Link to="/sign-up" className={styles.backLink}>
        Tilbake til registrering
      </Link>
    </div>
  );
};

export default RaceInfo;
