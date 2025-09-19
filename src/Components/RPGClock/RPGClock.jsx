import { useState, useEffect } from 'react';
import { getRPGCalendar } from '../../utils/rpgCalendar';
import styles from './RPGClock.module.css';

const RPGClock = ({ isMobile = false }) => {
  const [rpgTime, setRpgTime] = useState({
    rpgDay: 1,
    rpgHour: 0,
    rpgMinute: 0,
    rpgYear: 1,
    rpgMonth: 1,
    dayRange: { start: 1, end: 7 }
  });

  useEffect(() => {
    const updateRPGTime = () => {
      const now = new Date();
      const calendar = getRPGCalendar(now);
      
      // Finn hvilken dag i IRL-uken det er (0 = mandag, 6 = søndag)
      const dayOfWeek = now.getDay() === 0 ? 6 : now.getDay() - 1;
      const rpgRange = calendar.rpgDaysThisWeek[dayOfWeek];
      
      const realHour = now.getHours();
      const realMinute = now.getMinutes();
      const realSecond = now.getSeconds();
      
      // Beregn hvor mange RPG dager denne IRL dagen dekker
      const rpgDaysInThisRealDay = rpgRange.end - rpgRange.start + 1;
      
      // Del 24 timer på antall RPG dager for å få timer per RPG dag
      const hoursPerRPGDay = 24 / rpgDaysInThisRealDay;
      
      // Beregn hvilken RPG dag det er basert på IRL tid
      const rpgDayIndex = Math.floor(realHour / hoursPerRPGDay);
      const rpgDay = Math.min(rpgRange.start + rpgDayIndex, rpgRange.end);
      
      // Beregn RPG time basert på hvor langt vi er inn i denne RPG dagen
      const timeIntoCurrentRPGDay = (realHour % hoursPerRPGDay) + (realMinute / 60) + (realSecond / 3600);
      const rpgHour = Math.floor(timeIntoCurrentRPGDay * 24 / hoursPerRPGDay);
      const rpgMinute = Math.floor(((timeIntoCurrentRPGDay * 24 / hoursPerRPGDay) % 1) * 60);
      
      setRpgTime({
        rpgDay,
        rpgHour: Math.min(rpgHour, 23),
        rpgMinute,
        rpgYear: calendar.rpgYear,
        rpgMonth: calendar.rpgMonth,
        dayRange: rpgRange
      });
    };

    // Oppdater umiddelbart
    updateRPGTime();
    
    // Oppdater hvert sekund
    const interval = setInterval(updateRPGTime, 1000);
    
    return () => clearInterval(interval);
  }, []);

  const formatTime = (hour, minute) => {
    const displayHour = hour > 12 ? hour - 12 : hour;
    const ampm = hour < 12 ? 'AM' : 'PM';
    return `${displayHour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')} ${ampm}`;
  };

  const getDayName = (day) => {
    const dayNames = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
    const dayOfWeek = new Date().getDay();
    return dayNames[dayOfWeek];
  };

  if (isMobile) {
    return (
      <div className={styles.rpgClockMobile}>
        <span className={styles.rpgTime}>
          {formatTime(rpgTime.rpgHour, rpgTime.rpgMinute)}
        </span>
        <span className={styles.rpgDate}>
          Day {rpgTime.rpgDay} • {rpgTime.rpgMonth}/{rpgTime.rpgYear}
        </span>
      </div>
    );
  }

  return (
    <div className={styles.rpgClockDesktop}>
      <div className={styles.rpgClockHeader}>
        <h3>RPG Time</h3>
      </div>
      <div className={styles.rpgClockContent}>
        <div className={styles.rpgTime}>
          {formatTime(rpgTime.rpgHour, rpgTime.rpgMinute)}
        </div>
        <div className={styles.rpgDate}>
          Day {rpgTime.rpgDay} of {rpgTime.rpgMonth}/{rpgTime.rpgYear}
        </div>
        <div className={styles.rpgInfo}>
          <div className={styles.realDay}>
            Real: {getDayName()} {rpgTime.dayRange.start}-{rpgTime.dayRange.end}
          </div>
        </div>
      </div>
    </div>
  );
};

export default RPGClock;
