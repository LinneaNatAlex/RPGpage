import { useState, useEffect } from "react";
import { useAuth } from "../../context/authContext.jsx";
import { doc, onSnapshot, updateDoc, arrayUnion, arrayRemove } from "firebase/firestore";
import { db } from "../../firebaseConfig";
import styles from "./TopBar.module.css";
import "./TopBar.mobile.css";

const TopBar = () => {
  const { user } = useAuth();
  const [isMobile, setIsMobile] = useState(false);
  const [userData, setUserData] = useState(null);
  const [showInventory, setShowInventory] = useState(false);
  const [showGiftModal, setShowGiftModal] = useState(false);

  // Check if device is mobile
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Load user data
  useEffect(() => {
    if (!user) return;
    
    const userRef = doc(db, "users", user.uid);
    const unsub = onSnapshot(userRef, (userDoc) => {
      if (userDoc.exists()) {
        setUserData(userDoc.data());
      }
    });

    return () => unsub();
  }, [user]);

  if (!user || !userData) return null;

  return (
    <div className={`mobile-topbar ${isMobile ? 'mobile' : 'desktop'}`}>
      <div className="mobile-topbar-content">
        {/* User Avatar */}
        <div className="mobile-user-section">
          <img 
            src={user.photoURL || "/icons/avatar.svg"} 
            alt="Profile" 
            className="mobile-user-avatar"
          />
          <div className="mobile-user-info">
            <div className="mobile-user-name">{user.displayName}</div>
            <div className="mobile-user-level">Level {userData.level || 1}</div>
          </div>
        </div>

        {/* Health Bar */}
        <div className="mobile-health-section">
          <div className="mobile-health-bar">
            <div 
              className="mobile-health-fill"
              style={{ width: `${userData.health || 100}%` }}
            />
          </div>
          <div className="mobile-health-text">{userData.health || 100}/100</div>
        </div>

        {/* Currency */}
        <div className="mobile-currency-section">
          <div className="mobile-currency-item">
            <span className="mobile-currency-icon">💰</span>
            <span className="mobile-currency-amount">{userData.nits || 0}</span>
          </div>
          <div className="mobile-currency-item">
            <span className="mobile-currency-icon">◆</span>
            <span className="mobile-currency-amount">{userData.points || 0}</span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="mobile-actions-section">
          <button 
            className="mobile-action-btn"
            onClick={() => setShowInventory(!showInventory)}
            title="Inventory"
          >
            📦
          </button>
          <button 
            className="mobile-action-btn"
            onClick={() => setShowGiftModal(true)}
            title="Gift"
          >
            ⚜
          </button>
        </div>
      </div>

      {/* Mobile Inventory Modal */}
      {showInventory && (
        <div className="mobile-inventory-modal">
          <div className="mobile-inventory-header">
            <h3>Inventory</h3>
            <button 
              className="mobile-close-btn"
              onClick={() => setShowInventory(false)}
            >
              ✕
            </button>
          </div>
          <div className="mobile-inventory-content">
            {userData.inventory && userData.inventory.length > 0 ? (
              userData.inventory.map((item, index) => (
                <div key={index} className="mobile-inventory-item">
                  <div className="mobile-item-info">
                    <span className="mobile-item-name">{item.name}</span>
                    <span className="mobile-item-qty">x{item.qty || 1}</span>
                  </div>
                  <div className="mobile-item-actions">
                    {/* Read button for books - only show if book has proper content */}
                    {(item.type === "book" && 
                      item.pages && 
                      Array.isArray(item.pages) && 
                      item.pages.length > 0) && (
                      <button 
                        className="mobile-item-btn"
                        onClick={() => {
                          // Open book viewer - you'll need to implement this
                          console.log("Read book:", item);
                        }}
                      >
                        📖 Read
                      </button>
                    )}
                    <button className="mobile-item-btn">Use</button>
                    <button className="mobile-item-btn">Gift</button>
                    <button className="mobile-item-btn">Delete</button>
                  </div>
                </div>
              ))
            ) : (
              <p className="mobile-empty-inventory">No items in inventory</p>
            )}
          </div>
        </div>
      )}

      {/* Mobile Gift Modal */}
      {showGiftModal && (
        <div className="mobile-gift-modal">
          <div className="mobile-gift-header">
            <h3>Send Gift</h3>
            <button 
              className="mobile-close-btn"
              onClick={() => setShowGiftModal(false)}
            >
              ✕
            </button>
          </div>
          <div className="mobile-gift-content">
            <p>Gift functionality coming soon!</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default TopBar;
