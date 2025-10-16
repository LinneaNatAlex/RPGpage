import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import { useAuth } from "../context/authContext";
import { doc, updateDoc } from "firebase/firestore";
import { db } from "../firebaseConfig";

// Hook to track user location and update in Firebase
const useLocationTracker = () => {
  const location = useLocation();
  const { user } = useAuth();

  // Function to convert route path to readable location
  const getLocationFromPath = (pathname) => {
    const pathMap = {
      "/": "Main Hall",
      "/profile": "Personal Quarters",
      "/inventory": "Storage Room",
      "/news": "News Board",
      "/userMap": "Looking at Student Cards",
      "/forum": "Discussion Room",
      "/commonroom": "House Lounge",
      "/classes": "Classroom Hallway",
      "/astronomy": "Astronomy Class",
      "/potions": "Potions Laboratory",
      "/transfiguration": "Transfiguration Class",
      "/herbology": "Botany Greenhouse",
      "/defense": "Defense Class",
      "/charms": "Charms Classroom",
      "/shop": "School Store",
      "/leaderboard": "Achievement Hall",
      "/Rpg": "RPG Hall",
      "/Rpg/GreatHall": "The Great Hall",
      "/ClassRooms": "Classroom Hallway",
      "/ClassRooms/potions": "Potions Laboratory",
      "/werewolf": "Werewolf Territory",
      "/admin": "Administrative Office",
      "/teacher": "Teacher's Lounge",
      "/housepoints": "House Points Board",
    };

    // Forum location mapping - matches exactly with Forum.jsx
    const forumLocations = {
      "/forum/commonroom": "Commonroom",
      "/forum/ritualroom": "Ritual Room",
      "/forum/moongarden": "Moon Garden",
      "/forum/bloodbank": "Blood Bank",
      "/forum/nightlibrary": "Night Library",
      "/forum/gymnasium": "The Gymnasium",
      "/forum/infirmary": "The Infirmary",
      "/forum/greenhouse": "The Greenhouse",
      "/forum/artstudio": "The Art Studio",
      "/forum/kitchen": "Kitchen",
      "/forum/detentionclassroom": "Detention Classroom",
      // Race commonrooms
      "/forum/elf": "Elf Commonroom",
      "/forum/witch": "Witch Commonroom",
      "/forum/vampire": "Vampire Commonroom",
      "/forum/werewolf": "Werewolf Commonroom",
      // Special forums
      "/forum/16plus": "Private Discussion Room",
    };

    // Check if it's a user profile page
    if (pathname.startsWith("/user/")) {
      return "Visiting someone's room";
    }

    // Check if it's a specific forum location
    if (forumLocations[pathname]) {
      return forumLocations[pathname];
    }

    // Special handling for race-specific commonroom
    if (pathname === "/forum/commonroom" && user && user.race) {
      const raceCommonrooms = {
        elf: "Elf Commonroom",
        witch: "Witch Commonroom",
        vampire: "Vampire Commonroom",
        werewolf: "Werewolf Commonroom",
      };
      const raceKey = user.race.toLowerCase();
      return raceCommonrooms[raceKey] || "Commonroom";
    }

    // Check if it's a general forum topic (catches dynamic forum IDs)
    if (pathname.startsWith("/forum/")) {
      const forumId = pathname.split("/forum/")[1];
      // If it's not in our specific locations, it's probably a dynamic forum
      return `Forum: ${forumId.charAt(0).toUpperCase() + forumId.slice(1)}`;
    }

    // Check if it's a class page
    if (pathname.includes("/classes/")) {
      const className = pathname.split("/classes/")[1];
      return `Attending ${className} class`;
    }

    // Check if it's a classroom with ID
    if (pathname.startsWith("/classrooms/")) {
      const classId = pathname.split("/classrooms/")[1];
      return `In ${classId} classroom`;
    }

    return pathMap[pathname] || "Walking around school";
  };

  useEffect(() => {
    if (!user?.uid) {
      console.log("Location tracker: No user logged in");
      return;
    }

    console.log("Location tracker: Starting for user", user.uid);

    const updateUserLocation = async () => {
      try {
        const locationText = getLocationFromPath(location.pathname);
        const userRef = doc(db, "users", user.uid);

        const timestamp = Date.now();
        await updateDoc(userRef, {
          currentLocation: locationText,
          lastSeen: timestamp,
        });

        console.log(
          "Location updated:",
          locationText,
          "at",
          new Date(timestamp).toLocaleTimeString(),
          "for user:",
          user.uid
        );
      } catch (error) {
        console.error("Error updating user location:", error);
      }
    };

    // Update location immediately when route changes
    updateUserLocation();

    // Update location every 3 seconds to show user is still active (very fast updates for real-time tracking)
    const interval = setInterval(updateUserLocation, 3000);

    // Cleanup interval on unmount
    return () => clearInterval(interval);
  }, [location.pathname, user?.uid]);

  // Cleanup location when user navigates away or closes tab
  useEffect(() => {
    if (!user?.uid) return;

    const handleBeforeUnload = async () => {
      try {
        const userRef = doc(db, "users", user.uid);
        await updateDoc(userRef, {
          currentLocation: null,
          lastSeen: Date.now(),
        });
      } catch (error) {
        console.error("Error clearing user location:", error);
      }
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [user?.uid]);
};

export default useLocationTracker;
