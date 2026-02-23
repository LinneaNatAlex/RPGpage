# Firestore reads – oversikt og tips

Firebase tar betalt for lesing av dokumenter. Første 50 000 reads/dag er gratis.

## Endringer som allerede er gjort (mindre reads)

1. **RPGCalendarSidebar** – Bursdager hentes nå med **én** `getDocs(users)` i stedet for to. Halverer lesingene fra kalenderen (ca. 1× antall brukere per time i stedet for 2×).

2. **useOnlineUsers** – Byttet fra **onSnapshot** (realtime) til **polling hvert 60. sekund**. Før: hver gang noen gikk på/av ga det lesinger for alle som hadde appen åpen. Nå: én batch lesing per bruker per minutt.

3. **Forum – topic reply notifications** – Følgere lagres nå på tema-dokumentet (`topic.followerIds`). Ved svar brukes **1 getDoc(topic)** i stedet for **getDocs(users)** (én lesing per bruker i systemet). Follow/unfollow oppdaterer både bruker og topic. Eldre temaer uten `followerIds` faller tilbake til getDocs(users).

4. **useNotifications** – Byttet fra **onSnapshot** til **polling hvert 60. sekund**. Før: hver ny/oppdatert notifikasjon ga lesinger for alle som hadde listen åpen. Nå: maks 1 lesing per bruker per minutt.

5. **Forum – follower counts** – Antall følgere per tema hentes fra **topic.followerIds.length** når feltet finnes (0 ekstra lesinger). Kun temaer uten `followerIds` (eldre) trigger getDocs(users).

6. **Forum – "nytt tema"-varsler** – Varsling til «alle som følger forumet» ved opprettelse av nytt tema er **slått av** (sparte getDocs(users) per nytt tema). Varsler ved **svar** (topic.followerIds) er uendret.

## Steder som fortsatt bruker mange reads

| Kilde | Hva | Forslag |
|-------|-----|--------|
| **useChatMessages** | onSnapshot på `messages` (30 docs) + `rpgGrateHall` (150 docs) | Kan byttes til getDocs + polling når chat-fanen er synlig (f.eks. 15–30 s). Realtime er greit for få brukere. |
| **useUserData** | onSnapshot på brukerens eget `users/{uid}`-dokument | Én lesing per oppdatering. Kan beholdes; alternativt getDoc + polling (f.eks. 60 s). |
| **PrivateChat** | onSnapshot per åpen privat/group-chat | Allerede begrenset til valgt chat. Gruppe-listen (groupChats) kan caches/polles. |
| **TopBar** | onSnapshot på bruker (followedTopics) | Notifications polles nå 60 s (useNotifications). |
| **App.jsx** | onSnapshot config/site + onSnapshot bruker (potions) | config kan leses én gang ved oppstart; potions deles med useUserData. |
| **Forum** | fetchTopicFollowers (getDocs users for å vise hvem som følger) | Kan bruke topic.followerIds + usersListStore-cache. |
| **AdminPanel** | getDocs(users), getDocs(messages) | Kun for admin; kan begrenses med limit og cache. |

## Anbefalinger

- **Realtime (onSnapshot)** er dyrest når mange brukere lytter eller når store lister oppdateres ofte. Bruk der det virkelig trengs (f.eks. aktiv chat).
- **Polling** (getDocs/getDoc med setInterval) gir forutsigbar lesing: f.eks. 1 lesing per bruker per minutt.
- **Cache** – unngå å lese samme dokument på nytt innen kort tid (bruk state eller cache-lag).
- **Limit** – bruk `limit(n)` på queries slik at du ikke henter hele collections.

## Sjekke bruk

I [Firebase Console](https://console.firebase.google.com) → prosjektet → Usage and billing: se **Firestore – Reads** (daglig).
