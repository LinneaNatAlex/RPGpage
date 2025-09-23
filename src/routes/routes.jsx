// Import the nesessary modules
import {
  createBrowserRouter,
  createRoutesFromElements,
  Route,
} from "react-router-dom";

import App from "../App.jsx";
import ErrorBoundary from "../Components/ErrorBoundary/ErrorBoundary.jsx";
import ForumRules from "../Pages/ForumRules.jsx";
import GeneralRules from "../Pages/GeneralRules.jsx";
import AIUsageRules from "../Pages/AIUsageRules.jsx";
import ContentMediaRules from "../Pages/ContentMediaRules.jsx";
import PrivacySafetyRules from "../Pages/PrivacySafetyRules.jsx";
import AccountIdentityRules from "../Pages/AccountIdentityRules.jsx";
import CommunityBehaviorRules from "../Pages/CommunityBehaviorRules.jsx";
import TechnicalSiteRules from "../Pages/TechnicalSiteRules.jsx";
import ChatRules from "../Pages/ChatRules.jsx";
import RPGRules from "../Pages/RPGRules.jsx";
import ProfileContentRules from "../Pages/ProfileContentRules.jsx";
import RoleplayCharacterRules from "../Pages/RoleplayCharacterRules.jsx";
import LiveChatRPGRules from "../Pages/LiveChatRPGRules.jsx";
import MagicSpellRules from "../Pages/MagicSpellRules.jsx";
import RaceSchoolRules from "../Pages/RaceSchoolRules.jsx";
import DatingRelationshipRules from "../Pages/DatingRelationshipRules.jsx";
import Forum18Rules from "../Pages/18ForumRules.jsx";
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
import WerewolfIframe from "../Components/WerewolfIframe.jsx";
import { useAuth } from "../context/authContext.jsx";
import { Navigate } from "react-router-dom";
import Admin from "../Pages/Admin.jsx";
import Teacher from "../Pages/Teacher.jsx";
import AgeRestrictedForum from "../Components/Forum/AgeRestrictedForum";
import DetentionGuard from "../Components/Forum/DetentionGuard";
const TeacherRouteGuard = ({ children }) => {
  const { user, loading } = useAuth();
  const { roles, rolesLoading } = useUserRoles();
  if (loading || rolesLoading) return <div>Loading...</div>;
  if (!user) return <Navigate to="/sign-in" />;
  if (
    !(
      roles.includes("teacher") ||
      roles.includes("admin") ||
      roles.includes("archivist")
    )
  )
    return <Navigate to="/" />;
  return children;
};
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
    <Route path="/" element={<App />} errorElement={<ErrorBoundary />}>
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
            <DetentionGuard>
              <Forum />
            </DetentionGuard>
          </RouteGuard>
        }
      />
      <Route
        path="forum/16plus"
        element={
          <RouteGuard>
            <DetentionGuard>
              <AgeRestrictedForum>
                <Forum />
              </AgeRestrictedForum>
            </DetentionGuard>
          </RouteGuard>
        }
      />
      <Route path="forumrules" element={<ForumRules />} />
      <Route path="generalrules" element={<GeneralRules />} />
      <Route path="aiusagerules" element={<AIUsageRules />} />
      <Route path="contentmediarules" element={<ContentMediaRules />} />
      <Route path="privacysafetyrules" element={<PrivacySafetyRules />} />
      <Route path="accountidentityrules" element={<AccountIdentityRules />} />
      <Route
        path="communitybehaviorrules"
        element={<CommunityBehaviorRules />}
      />
      <Route path="technicalsiterules" element={<TechnicalSiteRules />} />
      <Route path="chatrules" element={<ChatRules />} />
      <Route path="rpgrules" element={<RPGRules />} />
      <Route path="profilecontentrules" element={<ProfileContentRules />} />
      <Route
        path="roleplaycharacterrules"
        element={<RoleplayCharacterRules />}
      />
      <Route path="livechatrpgrules" element={<LiveChatRPGRules />} />
      <Route path="magicspellrules" element={<MagicSpellRules />} />
      <Route path="raceschoolrules" element={<RaceSchoolRules />} />
      <Route
        path="datingrelationshiprules"
        element={<DatingRelationshipRules />}
      />
      <Route path="18forumrules" element={<Forum18Rules />} />
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
        path="werewolf"
        element={
          <RouteGuard>
            <WerewolfIframe />
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
        path="teacher"
        element={
          <TeacherRouteGuard>
            <Teacher />
          </TeacherRouteGuard>
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
