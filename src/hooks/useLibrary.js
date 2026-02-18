import { useEffect, useState } from "react";
import { db } from "../firebaseConfig";
import {
  collection,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  serverTimestamp,
} from "firebase/firestore";

const useLibrary = () => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchItems = async () => {
    try {
      const snapshot = await getDocs(collection(db, "library"));
      const data = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
      data.sort((a, b) => (a.order ?? 999) - (b.order ?? 999));
      setItems(data);
    } catch (err) {
      setItems([]);
    } finally {
      setLoading(false);
    }
  };

  const addItem = async (itemData) => {
    const docRef = await addDoc(collection(db, "library"), {
      title: itemData.title || "",
      content: itemData.content || "",
      order: itemData.order ?? items.length,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      createdBy: itemData.createdBy || null,
    });
    await fetchItems();
    return docRef.id;
  };

  const updateItem = async (id, itemData) => {
    const ref = doc(db, "library", id);
    await updateDoc(ref, {
      title: itemData.title ?? undefined,
      content: itemData.content ?? undefined,
      order: itemData.order !== undefined ? itemData.order : undefined,
      updatedAt: serverTimestamp(),
    });
    await fetchItems();
  };

  const deleteItem = async (id) => {
    await deleteDoc(doc(db, "library", id));
    await fetchItems();
  };

  useEffect(() => {
    fetchItems();
  }, []);

  return {
    items,
    loading,
    addItem,
    updateItem,
    deleteItem,
    refetchItems: fetchItems,
  };
};

export default useLibrary;
