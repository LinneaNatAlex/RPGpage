import {
  createBrowserRouter,
  createRoutesFromElements,
  Route,
} from "react-router-dom";

import App from "../App.jsx";
import Profile from "../Pages/Profile/Profile.jsx";
import SignIn from "../Pages/SignIn/SignIn.jsx";
import SignUp from "../Pages/SignUp/SignUp.jsx";
import MainPage from "../Pages/MainPage/MainPage.jsx";
import VerifyEmail from "../Pages/VerifyEmail/VerifyEmail.jsx";
import UserProfile from "../Pages/UserProfile/UserProfile.jsx";
import UserMap from "../Pages/UserMap/UserMap.jsx";
import ClassRooms from "../Pages/ClassRooms/ClassRooms.jsx";
import Potions from "../Pages/ClassRooms/Potions/Potions.jsx";
import Rpg from "../Pages/Rpg/Rpg.jsx";
import GreatHall from "../Pages/Rpg/GreateHall/GreatHall.jsx";
import { useAuth } from "../context/authContext.jsx";

import { Navigate } from "react-router-dom";

const RouteGuard = ({ children }) => {
  // Checks if user is sign in or not
  const { user, loading } = useAuth();
  if (loading) {
    return <div>Loading...</div>;
  }

  if (!user) {
    return <Navigate to="/sign-in" />;
  }
  // If user is signed in, returnig the children
  return children;
};

export const router = createBrowserRouter(
  createRoutesFromElements(
    <Route path="/" element={<App />}>
      {/* Public routes */}
      <Route index element={<MainPage />} />
      <Route path="sign-in" element={<SignIn />} />
      <Route path="sign-up" element={<SignUp />} />
      <Route path="*" element={<MainPage />} />
      {/* Protected routes */}
      <Route
        path="user/:uid"
        element={
          <RouteGuard>
            <UserProfile />
          </RouteGuard>
        }
      />
      <Route
        path="userMap"
        element={
          <RouteGuard>
            <UserMap />
          </RouteGuard>
        }
      />
      <Route
        path="ClassRooms"
        element={
          <RouteGuard>
            <ClassRooms />
          </RouteGuard>
        }
      />
      <Route
        path="Rpg"
        element={
          <RouteGuard>
            <Rpg />
          </RouteGuard>
        }
      />
      <Route
        path="Rpg/GreatHall"
        element={
          <RouteGuard>
            <GreatHall />
          </RouteGuard>
        }
      />

      <Route
        path="ClassRooms/Potions"
        element={
          <RouteGuard>
            <Potions />
          </RouteGuard>
        }
      />
      <Route
        path="Profile"
        element={
          <RouteGuard>
            <Profile />
          </RouteGuard>
        }
      />
      <Route
        path="verify-email"
        element={
          <RouteGuard>
            <VerifyEmail />
          </RouteGuard>
        }
      />
    </Route>
  )
);
