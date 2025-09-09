import firebase_admin
from firebase_admin import credentials, firestore

# Sett inn din egen serviceAccountKey.json filsti her
cred = credentials.Certificate('rpg-hp-firebase-adminsdk-fbsvc-7536d0f0d0.json')
firebase_admin.initialize_app(cred)
db = firestore.client()

users_ref = db.collection('users')
users = users_ref.stream()

for user in users:
    user_ref = users_ref.document(user.id)
    user_ref.update({'currency': 1000})
    print(f"Updated {user.id} to 1000 nits")
