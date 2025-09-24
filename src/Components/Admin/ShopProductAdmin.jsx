import { useState, useEffect } from "react";
import { db } from "../../firebaseConfig";
import { collection, addDoc, getDocs, doc, updateDoc, deleteDoc } from "firebase/firestore";
import { useImageUpload } from "../../hooks/useImageUpload";
import staticShopItems from "../Shop/itemsList";

const categories = ["Books", "Potions", "Ingredients", "Equipment", "Food"];

export default function ShopProductAdmin() {
  const { uploadImage } = useImageUpload();
  const [form, setForm] = useState({
    name: "",
    category: "Food",
    price: "",
    description: "",
    effect: "",
    health: "",
    image: "",
  });
  const [status, setStatus] = useState("");
  const [uploadingImage, setUploadingImage] = useState(false);
  const [existingProducts, setExistingProducts] = useState([]);
  const [editingProduct, setEditingProduct] = useState(null);
  const [showEditForm, setShowEditForm] = useState(false);

  // Hent eksisterende produkter
  const fetchProducts = async () => {
    try {
      console.log("Fetching products...");
      const querySnapshot = await getDocs(collection(db, "shopItems"));
      const products = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      console.log("Products loaded:", products);
      setExistingProducts(products);
    } catch (error) {
      console.error("Error fetching products:", error);
      console.error("Error details:", error.code, error.message);
      setStatus("Feil ved henting av produkter: " + error.message + " (Kode: " + error.code + ")");
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
  };

  const handleImageChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validate file size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      alert("Bildet er for stort. Maksimal størrelse er 2MB.");
      return;
    }

    // Validate file type
    if (!file.type.startsWith("image/")) {
      alert("Vennligst velg et gyldig bildeformat.");
      return;
    }

    setUploadingImage(true);
    try {
      const imageUrl = await uploadImage(file);
      if (imageUrl) {
        setForm((f) => ({ ...f, image: imageUrl }));
      }
    } catch (error) {
      console.error("Error uploading image:", error);
      alert("Kunne ikke laste opp bilde. Prøv igjen.");
    } finally {
      setUploadingImage(false);
    }
  };

  const removeImage = () => {
    setForm((f) => ({ ...f, image: "" }));
  };

  const startEdit = (product) => {
    setEditingProduct(product);
    setForm({
      name: product.name || "",
      category: product.category || "Food",
      price: product.price || "",
      description: product.description || "",
      effect: product.effect || "",
      health: product.health || "",
      image: product.image || "",
    });
    setShowEditForm(true);
  };

  const cancelEdit = () => {
    setEditingProduct(null);
    setShowEditForm(false);
    setForm({
      name: "",
      category: "Food",
      price: "",
      description: "",
      effect: "",
      health: "",
      image: "",
    });
  };

  const updateProduct = async (e) => {
    e.preventDefault();
    if (!editingProduct) return;
    
    setStatus("");
    if (!form.name || !form.category || !form.price) {
      setStatus("Navn, kategori og pris er påkrevd.");
      return;
    }

    try {
      console.log("Updating product with ID:", editingProduct.id);
      console.log("Editing product:", editingProduct);
      
      const docData = {
        ...form,
        price: Number(form.price),
        updatedAt: Date.now(),
      };
      if (form.health) {
        docData.health = Number(form.health);
      } else {
        delete docData.health;
      }
      
      console.log("Updating with data:", docData);
      
      await updateDoc(doc(db, "shopItems", editingProduct.id), docData);
      setStatus("Produkt oppdatert!");
      
      // Refresh produkter fra Firestore
      await fetchProducts();
      
      cancelEdit();
    } catch (err) {
      console.error("Oppdatering feil:", err);
      console.error("Product ID:", editingProduct.id);
      console.error("Product data:", editingProduct);
      setStatus("Feil ved oppdatering: " + err.message + " (Kode: " + err.code + ")");
    }
  };

  const deleteProduct = async (productId) => {
    if (!window.confirm("Er du sikker på at du vil slette dette produktet?")) {
      return;
    }
    
    try {
      await deleteDoc(doc(db, "shopItems", productId));
      setStatus("Produkt slettet!");
      
      // Refresh produkter fra Firestore
      await fetchProducts();
    } catch (err) {
      setStatus("Feil ved sletting: " + err.message);
    }
  };

  const convertStaticToFirestore = async (staticProduct) => {
    // Sjekk om produktet allerede er konvertert
    const alreadyConverted = existingProducts.find(p => 
      p.originalId === staticProduct.id || 
      (p.name === staticProduct.name && p.category === staticProduct.category)
    );
    
    if (alreadyConverted) {
      setStatus("Dette produktet er allerede konvertert til Firestore!");
      return;
    }
    
    try {
      const docData = {
        name: staticProduct.name,
        category: staticProduct.category,
        price: staticProduct.price,
        description: staticProduct.description || "",
        effect: staticProduct.effect || "",
        health: staticProduct.health || "",
        image: "", // Tomt bilde som kan fylles ut
        type: staticProduct.type || "food",
        createdAt: Date.now(),
        convertedFromStatic: true,
        originalId: staticProduct.id
      };
      
      console.log("Converting static product:", staticProduct);
      console.log("Data to save:", docData);
      
      const docRef = await addDoc(collection(db, "shopItems"), docData);
      console.log("Created document with ID:", docRef.id);
      
      setStatus("Statisk produkt konvertert til Firestore! Du kan nå redigere det.");
      
      // Refresh produkter fra Firestore
      await fetchProducts();
    } catch (err) {
      console.error("Konvertering feil:", err);
      setStatus("Feil ved konvertering: " + err.message + " (Kode: " + err.code + ")");
    }
  };

  const convertAllStaticProducts = async () => {
    if (!window.confirm(`Er du sikker på at du vil konvertere alle ${staticShopItems.length} statiske produkter til Firestore? Dette kan ta litt tid.`)) {
      return;
    }
    
    setStatus("Konverterer alle statiske produkter...");
    let converted = 0;
    let errors = 0;
    
    for (const staticProduct of staticShopItems) {
      try {
        // Sjekk om allerede konvertert
        const alreadyConverted = existingProducts.find(p => 
          p.originalId === staticProduct.id || 
          (p.name === staticProduct.name && p.category === staticProduct.category)
        );
        
        if (alreadyConverted) {
          console.log(`Skipping already converted: ${staticProduct.name}`);
          continue;
        }
        
        const docData = {
          name: staticProduct.name,
          category: staticProduct.category,
          price: staticProduct.price,
          description: staticProduct.description || "",
          effect: staticProduct.effect || "",
          health: staticProduct.health || "",
          image: "",
          type: staticProduct.type || "food",
          createdAt: Date.now(),
          convertedFromStatic: true,
          originalId: staticProduct.id
        };
        
        await addDoc(collection(db, "shopItems"), docData);
        converted++;
        console.log(`Converted: ${staticProduct.name}`);
        
        // Oppdater status hver 10. konvertering
        if (converted % 10 === 0) {
          setStatus(`Konvertert ${converted}/${staticShopItems.length} produkter...`);
        }
        
      } catch (err) {
        console.error(`Error converting ${staticProduct.name}:`, err);
        errors++;
      }
    }
    
    setStatus(`Konvertering fullført! ${converted} produkter konvertert, ${errors} feil.`);
    
    // Refresh produkter fra Firestore
    await fetchProducts();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus("");
    if (!form.name || !form.category || !form.price) {
      setStatus("Navn, kategori og pris er påkrevd.");
      return;
    }
    
    if (editingProduct) {
      await updateProduct(e);
      return;
    }
    
    try {
      // Sett type automatisk hvis Food
      const docData = {
        ...form,
        price: Number(form.price),
        createdAt: Date.now(),
      };
      if (form.category === "Food") {
        docData.type = "food";
      }
      if (form.health) {
        docData.health = Number(form.health);
      } else {
        delete docData.health;
      }
      const docRef = await addDoc(collection(db, "shopItems"), docData);
      setStatus("Product added!");
      
      // Refresh produkter fra Firestore
      await fetchProducts();
      
      setForm({
        name: "",
        category: "Food",
        price: "",
        description: "",
        effect: "",
        health: "",
        image: "",
      });
    } catch (err) {
      setStatus("Error: " + err.message);
    }
  };

  return (
    <div
      style={{
        background: "#23232b",
        color: "#fff",
        padding: 20,
        borderRadius: 10,
        marginTop: 24,
      }}
    >
      <h3>{editingProduct ? "Edit product" : "Add new product to Shop"}</h3>
      <form
        onSubmit={handleSubmit}
        style={{ display: "flex", flexDirection: "column", gap: 10 }}
      >
        <input
          name="name"
          value={form.name}
          onChange={handleChange}
          placeholder="Name"
        />
        <select name="category" value={form.category} onChange={handleChange}>
          {categories.map((cat) => (
            <option key={cat} value={cat}>
              {cat}
            </option>
          ))}
        </select>
        <input
          name="price"
          value={form.price}
          onChange={handleChange}
          placeholder="Price (Nits)"
          type="number"
          min="0"
        />
        <input
          name="description"
          value={form.description}
          onChange={handleChange}
          placeholder="Description"
        />
        <input
          name="effect"
          value={form.effect}
          onChange={handleChange}
          placeholder="Effect (optional)"
        />
        <input
          name="health"
          value={form.health}
          onChange={handleChange}
          placeholder="HP restore (valgfritt)"
          type="number"
          min="0"
        />
        
        {/* Image Upload Section */}
        <div style={{ marginTop: "1rem" }}>
          <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: "bold" }}>
            Product Image:
          </label>
          {form.image ? (
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "0.5rem" }}>
              <img
                src={form.image}
                alt="Product preview"
                style={{
                  maxWidth: "150px",
                  maxHeight: "150px",
                  borderRadius: "8px",
                  border: "2px solid #7B6857",
                  objectFit: "cover"
                }}
              />
              <button
                type="button"
                onClick={removeImage}
                style={{
                  background: "#c44",
                  color: "white",
                  border: "none",
                  padding: "0.5rem 1rem",
                  borderRadius: "4px",
                  cursor: "pointer"
                }}
              >
                Fjern bilde
              </button>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "0.5rem" }}>
              <label style={{ cursor: "pointer" }}>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  disabled={uploadingImage}
                  style={{ display: "none" }}
                />
                <span
                  style={{
                    display: "inline-block",
                    background: uploadingImage ? "#666" : "linear-gradient(135deg, #7B6857 0%, #8B7A6B 100%)",
                    color: "white",
                    padding: "0.75rem 1.5rem",
                    borderRadius: "8px",
                    cursor: uploadingImage ? "not-allowed" : "pointer",
                    fontWeight: "600",
                    transition: "all 0.3s ease"
                  }}
                >
                  {uploadingImage ? "Laster opp..." : "Velg bilde"}
                </span>
              </label>
              <p style={{ color: "#ccc", fontSize: "0.9rem", margin: "0" }}>
                Maks størrelse: 2MB. Anbefalt: 300x300px
              </p>
            </div>
          )}
        </div>
        
        <div style={{ display: "flex", gap: "10px" }}>
          <button type="submit">
            {editingProduct ? "Oppdater produkt" : "Legg til produkt"}
          </button>
          {editingProduct && (
            <button type="button" onClick={cancelEdit} style={{ background: "#666" }}>
              Avbryt
            </button>
          )}
        </div>
      </form>
      {status && <div style={{ marginTop: 8 }}>{status}</div>}
      
      {/* Eksisterende produkter */}
      <div style={{ marginTop: "2rem" }}>
        <h4>Eksisterende produkter (Firestore: {existingProducts.length}, Statiske: {staticShopItems.filter(product => {
          const isConverted = existingProducts.some(p => 
            p.originalId === product.id || 
            (p.name === product.name && p.category === product.category)
          );
          return !isConverted;
        }).length} ikke-konverterte)</h4>
        
        {/* Firestore produkter (kan redigeres) */}
        <h5 style={{ color: "#7B6857", marginTop: "1rem" }}>Firestore produkter (kan redigeres)</h5>
        {existingProducts.length === 0 && (
          <div style={{ color: "#ccc", fontStyle: "italic" }}>
            Ingen Firestore produkter funnet.
          </div>
        )}
        <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          {existingProducts.map((product) => (
            <div
              key={product.id}
              style={{
                background: "#2a2a2a",
                padding: "1rem",
                borderRadius: "8px",
                border: "1px solid #444",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center"
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
                {product.image && (
                  <img
                    src={product.image}
                    alt={product.name}
                    style={{
                      width: "60px",
                      height: "60px",
                      borderRadius: "8px",
                      objectFit: "cover"
                    }}
                  />
                )}
                <div>
                  <div style={{ fontWeight: "bold", color: "#fff" }}>{product.name}</div>
                  <div style={{ color: "#ccc", fontSize: "0.9rem" }}>
                    {product.category} - {product.price} Nits
                  </div>
                  {product.description && (
                    <div style={{ color: "#aaa", fontSize: "0.8rem" }}>
                      {product.description}
                    </div>
                  )}
                </div>
              </div>
              <div style={{ display: "flex", gap: "0.5rem" }}>
                <button
                  onClick={() => {
                    console.log("Edit button clicked for product:", product);
                    startEdit(product);
                  }}
                  style={{
                    background: "#7B6857",
                    color: "white",
                    border: "none",
                    padding: "0.5rem 1rem",
                    borderRadius: "4px",
                    cursor: "pointer"
                  }}
                >
                  Rediger
                </button>
                <button
                  onClick={() => {
                    console.log("Delete button clicked for product:", product.id);
                    deleteProduct(product.id);
                  }}
                  style={{
                    background: "#c44",
                    color: "white",
                    border: "none",
                    padding: "0.5rem 1rem",
                    borderRadius: "4px",
                    cursor: "pointer"
                  }}
                >
                  Slett
                </button>
              </div>
            </div>
          ))}
        </div>
        
        {/* Statiske produkter (read-only) */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "2rem" }}>
          <h5 style={{ color: "#666", margin: 0 }}>Statiske produkter (read-only)</h5>
          <button
            onClick={convertAllStaticProducts}
            style={{
              background: "#4CAF50",
              color: "white",
              border: "none",
              padding: "0.5rem 1rem",
              borderRadius: "4px",
              cursor: "pointer",
              fontSize: "0.9rem"
            }}
          >
            Konverter alle statiske produkter
          </button>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          {staticShopItems
            .filter(product => {
              // Filtrer ut produkter som allerede er konvertert
              const isConverted = existingProducts.some(p => 
                p.originalId === product.id || 
                (p.name === product.name && p.category === product.category)
              );
              return !isConverted;
            })
            .slice(0, 10)
            .map((product) => (
            <div
              key={product.id}
              style={{
                background: "#1a1a1a",
                padding: "1rem",
                borderRadius: "8px",
                border: "1px solid #333",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                opacity: 0.7
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
                {product.image && (
                  <img
                    src={product.image}
                    alt={product.name}
                    style={{
                      width: "60px",
                      height: "60px",
                      borderRadius: "8px",
                      objectFit: "cover"
                    }}
                  />
                )}
                <div>
                  <div style={{ fontWeight: "bold", color: "#ccc" }}>{product.name}</div>
                  <div style={{ color: "#999", fontSize: "0.9rem" }}>
                    {product.category} - {product.price} Nits
                  </div>
                  {product.description && (
                    <div style={{ color: "#777", fontSize: "0.8rem" }}>
                      {product.description}
                    </div>
                  )}
                </div>
              </div>
              <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
                {existingProducts.find(p => 
                  p.originalId === product.id || 
                  (p.name === product.name && p.category === product.category)
                ) ? (
                  <div style={{ color: "#4CAF50", fontSize: "0.9rem", fontWeight: "bold" }}>
                    ✓ Allerede konvertert
                  </div>
                ) : (
                  <button
                    onClick={() => convertStaticToFirestore(product)}
                    style={{
                      background: "#7B6857",
                      color: "white",
                      border: "none",
                      padding: "0.5rem 1rem",
                      borderRadius: "4px",
                      cursor: "pointer",
                      fontSize: "0.9rem"
                    }}
                  >
                    Konverter til Firestore
                  </button>
                )}
                <div style={{ color: "#666", fontSize: "0.9rem", fontStyle: "italic" }}>
                  Statisk
                </div>
              </div>
            </div>
          ))}
          {(() => {
            const nonConvertedItems = staticShopItems.filter(product => {
              const isConverted = existingProducts.some(p => 
                p.originalId === product.id || 
                (p.name === product.name && p.category === product.category)
              );
              return !isConverted;
            });
            
            if (nonConvertedItems.length > 10) {
              return (
                <div style={{ color: "#666", fontStyle: "italic", textAlign: "center" }}>
                  ... og {nonConvertedItems.length - 10} flere ikke-konverterte statiske produkter
                </div>
              );
            }
            return null;
          })()}
        </div>
      </div>
    </div>
  );
}
