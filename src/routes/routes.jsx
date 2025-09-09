// Import the nesessary modules
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
import Forum from "../Pages/Forum/Forum.jsx";
import RaceInfo from "../Pages/RaceInfo/RaceInfo.jsx";
import Shop from "../Components/Shop/Shop.jsx";
import { useAuth } from "../context/authContext.jsx";
import { Navigate } from "react-router-dom";
import Admin from "../Pages/Admin.jsx";
import useUserRoles from "../hooks/useUserRoles";
import HousePointsPage from "../Pages/HousePoints.jsx";
import ClassroomSession from "../Components/Classrooms/ClassroomSession.jsx";

const RouteGuard = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) return <div>Loading...</div>;
  if (!user) return <Navigate to="/sign-in" />;
  if (!user.emailVerified) return <Navigate to="/verify-email" />;

  return children;
};

const AdminRouteGuard = ({ children }) => {
  const { user, loading } = useAuth();
  const { roles, rolesLoading } = useUserRoles();
  if (loading || rolesLoading) return <div>Loading...</div>;
  if (!user) return <Navigate to="/sign-in" />;
  if (!roles.includes("admin")) return <Navigate to="/" />;
  return children;
};

export const router = createBrowserRouter(
  createRoutesFromElements(
    <Route path="/" element={<App />}>
      {/*----------------------------- Public routes -----------------------------*/}
      <Route index element={<MainPage />} />
      <Route path="sign-in" element={<SignIn />} />
      <Route path="sign-up" element={<SignUp />} />
      <Route path="race-info/:race" element={<RaceInfo />} />
      <Route path="*" element={<MainPage />} />
      <Route path="verify-email" element={<VerifyEmail />} />
      {/*---------------------------------- Protected routes --------------------------*/}
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
        path="forum/:forumId"
        element={
          <RouteGuard>
            <Forum />
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
        path="ClassRooms/potions"
        element={
          <RouteGuard>
            <ClassroomSession />
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
        path="shop"
        element={
          <RouteGuard>
            <Shop />
          </RouteGuard>
        }
      />
      <Route
        path="admin"
        element={
          <AdminRouteGuard>
            <Admin />
          </AdminRouteGuard>
        }
      />
      <Route
        path="housepoints"
        element={
          <RouteGuard>
            <HousePointsPage />
          </RouteGuard>
        }
      />
      <Route
        path="classrooms/:classId"
        element={
          <RouteGuard>
            <ClassroomSession />
          </RouteGuard>
        }
      />
    </Route>
  )
);
