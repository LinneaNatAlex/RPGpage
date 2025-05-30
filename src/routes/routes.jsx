import {
  createBrowserRouter,
  createRoutesFromElements,
  Route,
} from "react-router-dom";

import App from "../App.jsx";
import Profile from "../Pages/Profile/Profile.jsx";
import EditProfile from "../Pages/EditProfile/EditProfile.jsx";
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

export const router = createBrowserRouter(
  createRoutesFromElements(
    <Route path="/" element={<App />}>
      <Route index element={<MainPage />} />
      <Route path="Profile" element={<Profile />} />
      <Route path="edit-profile" element={<EditProfile />} />
      <Route path="sign-in" element={<SignIn />} />
      <Route path="sign-up" element={<SignUp />} />
      <Route path="verify-email" element={<VerifyEmail />} />
      <Route path="user/:uid" element={<UserProfile />} />
      <Route path="userMap" element={<UserMap />} />
      <Route path="ClassRooms" element={<ClassRooms />} />
      <Route path="Rpg" element={<Rpg />} />
      <Route path="Rpg/GreatHall" element={<GreatHall />} />
      <Route path="*" element={<MainPage />} />
      <Route path="ClassRooms/Potions" element={<Potions />} />
    </Route>
  )
);
