import styles from './NewsFeed.module.css';
import useNewsFeed from '../../hooks/useNewsFeed';
import { auth, db } from '../../firebaseConfig';
import Button from '../Button/Button';
import { useState } from 'react';
import useUserRoles from '../../hooks/useUserRoles';
import { addDoc, collection, deleteDoc, doc, serverTimestamp } from 'firebase/firestore';

const NewsFeed = () => {
    // State to hold the news articles
   const {news, refetchNews} = useNewsFeed();
   const roles = useUserRoles();
   const isAdmin = roles.includes('admin');
   const user = auth.currentUser;

   const [title, setTitle] = useState('');
   const [content, setContent] = useState('');
   const [showForm, setShowForm] = useState(false);

   const handlePostNews = async (e) => {
         e.preventDefault();
         if (!user) return {
              error: "User not authenticated"
         }
    
         try {
              await addDoc(collection(db, 'news'), {
                title,
                content,
                displayName: user.displayName,
                timestamp: serverTimestamp(),
              });
              setTitle('');
              setContent('');
              setShowForm(false);
              await refetchNews();
         } catch (error) {
              console.error("Error posting news: ", error);
         }
   };

   const handleDeleteNews = async (id) => {
         try {
            await deleteDoc(doc(db, 'news', id));
            await refetchNews();
         } catch (error) {
              console.error("Error deleting news: ", error);
         }
   };

return (
    <section className={styles.newsThreadContainer}>
        <h2 className={styles.newsThreadTitle}>Latest News</h2>
        {isAdmin && (
            <>
            <Button className={styles.postNewsBtn} onClick={() => setShowForm(!showForm)}>
                {showForm ? 'Cancel' : 'Post News'}
            </Button>
            {showForm && (
                <div className={styles.popupForm}>
                    <div className={styles.formContainer}>
                        <h3>Post News</h3>
                        <form onSubmit={handlePostNews}>
                            <input
                                type="text"
                                placeholder="Title"
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                required
                            />
                            <textarea
                                placeholder="Content"
                                value={content}
                                onChange={(e) => setContent(e.target.value)}
                                required
                            />
                            <Button type="submit">Post</Button>
                        </form>
                    </div>
                </div>

            )}
        </>
    )}

    {news.length === 0 ? (
        <p className={styles.noneNews}>No news available</p>
    ) : (
        <div className={styles.newsContainer}>
            {news.map((thread) => (
               <div key={thread.id} className={styles.newsThread}>
                    <h3 className={styles.newsThreadTitle}>{thread.title}</h3>
                    <p className={styles.newsThreadContent}>{thread.content}</p>
                    {thread.displayName && <strong> Written by: {thread.displayName}</strong>} 
                    {isAdmin && (
                        <Button onClick={() => handleDeleteNews(thread.id)} className={styles.deleteBtn}>
                            Delete
                        </Button>
                    )}
                </div>
            ))}
        </div>
        )}
    </section>
    );
};
export default NewsFeed;

