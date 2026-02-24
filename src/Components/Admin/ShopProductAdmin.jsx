import { useState, useEffect } from "react";
import { db } from "../../firebaseConfig";
import {
  collection,
  addDoc,
  getDocs,
  doc,
  updateDoc,
  deleteDoc,
} from "firebase/firestore";
import { useImageUpload } from "../../hooks/useImageUpload";
import staticShopItems from "../Shop/itemsList";

const categories = [
  "Books",
  "Potions",
  "Ingredients",
  "Equipment",
  "Food",
];

export default function ShopProductAdmin({ restrictToBooksOnly = false }) {
  const { uploadImage } = useImageUpload();
  const [form, setForm] = useState({
    name: "",
    category: restrictToBooksOnly ? "Books" : "Food",
    price: "",
    description: "",
    effect: "",
    health: "",
    image: "",
    petHpRestore: "",
    bonusTime: "",
  });
  const [status, setStatus] = useState("");
  const [uploadingImage, setUploadingImage] = useState(false);
  const [existingProducts, setExistingProducts] = useState([]);
  const [editingProduct, setEditingProduct] = useState(null);
  const [showEditForm, setShowEditForm] = useState(false);
  const [categoryFilter, setCategoryFilter] = useState(
    restrictToBooksOnly ? "Books" : "All"
  );

  // Fetch existing products
  const fetchProducts = async () => {
    try {
      const querySnapshot = await getDocs(collection(db, "shopItems"));
      const products = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setExistingProducts(products);
    } catch (error) {
      setStatus(
        "Error fetching products: " +
          error.message +
          " (Code: " +
          error.code +
          ")"
      );
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
      alert("Image is too large. Maximum size is 2MB.");
      return;
    }

    // Validate file type
    if (!file.type.startsWith("image/")) {
      alert("Please select a valid image format.");
      return;
    }

    setUploadingImage(true);
    try {
      const imageUrl = await uploadImage(file);
      if (imageUrl) {
        setForm((f) => ({ ...f, image: imageUrl }));
      }
    } catch (error) {
      alert("Could not upload image. Please try again.");
    } finally {
      setUploadingImage(false);
    }
  };

  const removeImage = () => {
    setForm((f) => ({ ...f, image: "" }));
  };

  const startEdit = (product) => {
    if (restrictToBooksOnly && product.category !== "Books") return;
    setEditingProduct(product);
    setForm({
      name: product.name || "",
      category: product.category || (restrictToBooksOnly ? "Books" : "Food"),
      price: product.price || "",
      description: product.description || "",
      effect: product.effect || "",
      health: product.health || "",
      image: product.image || "",
      petHpRestore: product.petHpRestore || "",
      bonusTime: product.bonusTime || "",
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
      petHpRestore: "",
      bonusTime: "",
    });
  };

  const updateProduct = async (e) => {
    e.preventDefault();
    if (!editingProduct) return;
    if (restrictToBooksOnly && editingProduct.category !== "Books") return;

    setStatus("");
    if (!form.name || !form.category || !form.price) {
      setStatus("Name, category and price are required.");
      return;
    }

    try {

      const docData = {
        ...form,
        price: Number(form.price),
        updatedAt: Date.now(),
      };

      // Set type based on category
      if (form.category === "Food") {
        docData.type = "food";
      } else if (form.category === "Pet Items") {
        docData.type = "petFood";
      }

      if (form.health) {
        docData.health = Number(form.health);
      } else {
        delete docData.health;
      }

      // Pet Food specific fields
      if (form.category === "Pet Items") {
        if (form.petHpRestore) {
          docData.petHpRestore = Number(form.petHpRestore);
        } else {
          delete docData.petHpRestore;
        }
        if (form.bonusTime) {
          docData.bonusTime = Number(form.bonusTime);
        } else {
          delete docData.bonusTime;
        }
      } else {
        // Remove pet fields if not pet items
        delete docData.petHpRestore;
        delete docData.bonusTime;
      }


      await updateDoc(doc(db, "shopItems", editingProduct.id), docData);
      setStatus("Product updated!");

      // Refresh produkter fra Firestore
      await fetchProducts();

      cancelEdit();
    } catch (err) {
      setStatus("Error updating: " + err.message + " (Code: " + err.code + ")");
    }
  };

  const deleteProduct = async (productId, product) => {
    if (restrictToBooksOnly && product?.category !== "Books") return;
    if (!window.confirm("Are you sure you want to delete this product?")) {
      return;
    }

    try {
      await deleteDoc(doc(db, "shopItems", productId));
      setStatus("Product deleted!");

      // Refresh produkter fra Firestore
      await fetchProducts();
    } catch (err) {
      setStatus("Error deleting: " + err.message);
    }
  };

  const convertStaticToFirestore = async (staticProduct) => {
    if (restrictToBooksOnly && staticProduct.category !== "Books") return;
    // Sjekk om produktet allerede er konvertert
    const alreadyConverted = existingProducts.find(
      (p) =>
        p.originalId === staticProduct.id ||
        (p.name === staticProduct.name && p.category === staticProduct.category)
    );

    if (alreadyConverted) {
      setStatus("This product is already converted to Firestore!");
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
        image: staticProduct.image || "", // Use static image if available
        type: staticProduct.type || "food",
        createdAt: Date.now(),
        convertedFromStatic: true,
        originalId: staticProduct.id,
      };

      // Add pet food specific fields if they exist
      if (staticProduct.petHpRestore) {
        docData.petHpRestore = staticProduct.petHpRestore;
      }
      if (staticProduct.bonusTime) {
        docData.bonusTime = staticProduct.bonusTime;
      }


      const docRef = await addDoc(collection(db, "shopItems"), docData);

      setStatus("Static product converted to Firestore! You can now edit it.");

      // Refresh produkter fra Firestore
      await fetchProducts();
    } catch (err) {
      setStatus(
        "Error converting: " + err.message + " (Code: " + err.code + ")"
      );
    }
  };

  const convertAllStaticProducts = async () => {
    if (
      !window.confirm(
        `Are you sure you want to convert all ${staticShopItems.length} static products to Firestore? This may take some time.`
      )
    ) {
      return;
    }

    setStatus("Converting all static products...");
    let converted = 0;
    let errors = 0;

    for (const staticProduct of staticShopItems) {
      try {
        // Sjekk om allerede konvertert
        const alreadyConverted = existingProducts.find(
          (p) =>
            p.originalId === staticProduct.id ||
            (p.name === staticProduct.name &&
              p.category === staticProduct.category)
        );

        if (alreadyConverted) {
          continue;
        }

        const docData = {
          name: staticProduct.name,
          category: staticProduct.category,
          price: staticProduct.price,
          description: staticProduct.description || "",
          effect: staticProduct.effect || "",
          health: staticProduct.health || "",
          image: staticProduct.image || "",
          type: staticProduct.type || "food",
          createdAt: Date.now(),
          convertedFromStatic: true,
          originalId: staticProduct.id,
        };

        // Add pet food specific fields if they exist
        if (staticProduct.petHpRestore) {
          docData.petHpRestore = staticProduct.petHpRestore;
        }
        if (staticProduct.bonusTime) {
          docData.bonusTime = staticProduct.bonusTime;
        }

        await addDoc(collection(db, "shopItems"), docData);
        converted++;

        // Oppdater status hver 10. konvertering
        if (converted % 10 === 0) {
          setStatus(
            `Converted ${converted}/${staticShopItems.length} products...`
          );
        }
      } catch (err) {
        errors++;
      }
    }

    setStatus(
      `Conversion completed! ${converted} products converted, ${errors} errors.`
    );

    // Refresh produkter fra Firestore
    await fetchProducts();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus("");
    const category = restrictToBooksOnly ? "Books" : form.category;
    if (!form.name || !category || !form.price) {
      setStatus("Name, category and price are required.");
      return;
    }

    if (editingProduct) {
      await updateProduct(e);
      return;
    }

    try {
      // Sett type automatisk basert på category (archivists can only add Books)
      const docData = {
        ...form,
        category,
        price: Number(form.price),
        createdAt: Date.now(),
      };
      if (category === "Food") {
        docData.type = "food";
      } else if (category === "Pet Items") {
        docData.type = "petFood";
      }
      if (form.health) {
        docData.health = Number(form.health);
      } else {
        delete docData.health;
      }

      // Pet Food specific fields
      if (category === "Pet Items") {
        if (form.petHpRestore) {
          docData.petHpRestore = Number(form.petHpRestore);
        }
        if (form.bonusTime) {
          docData.bonusTime = Number(form.bonusTime);
        }
      }
      const docRef = await addDoc(collection(db, "shopItems"), docData);
      setStatus("Product added!");

      // Refresh produkter fra Firestore
      await fetchProducts();

      setForm({
        name: "",
        category: restrictToBooksOnly ? "Books" : "Food",
        price: "",
        description: "",
        effect: "",
        health: "",
        image: "",
        petHpRestore: "",
        bonusTime: "",
      });
    } catch (err) {
      setStatus("Error: " + err.message);
    }
  };

  return (
    <div
      style={{
        background: "#F5EFE0",
        color: "#2C2C2C",
        padding: "24px",
        borderRadius: 0,
        marginTop: "32px",
        marginBottom: "24px",
        border: "2px solid #D4C4A8",
      }}
    >
      <h3 style={{ marginBottom: "20px", color: "#5D4E37" }}>
        {restrictToBooksOnly
          ? "Books only (Archivist – edit book text/details)"
          : editingProduct
            ? "Edit product"
            : "Add new product to Shop"}
      </h3>
      <form
        onSubmit={handleSubmit}
        style={{ display: "flex", flexDirection: "column", gap: "16px" }}
      >
        <label htmlFor="shop-product-name">Name</label>
        <input
          id="shop-product-name"
          name="name"
          value={form.name}
          onChange={handleChange}
          placeholder="Name"
          autoComplete="off"
        />
        {restrictToBooksOnly ? (
          <div>
            <label>Category</label>
            <div style={{ padding: "8px 0", color: "#5D4E37" }}>Books</div>
          </div>
        ) : (
          <>
            <label htmlFor="shop-product-category">Category</label>
            <select id="shop-product-category" name="category" value={form.category} onChange={handleChange}>
              {categories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </>
        )}
        <label htmlFor="shop-product-price">Price (Nits)</label>
        <input
          id="shop-product-price"
          name="price"
          value={form.price}
          onChange={handleChange}
          placeholder="Price (Nits)"
          type="number"
          min="0"
          autoComplete="off"
        />
        <label htmlFor="shop-product-description">Description</label>
        <input
          id="shop-product-description"
          name="description"
          value={form.description}
          onChange={handleChange}
          placeholder="Description"
          autoComplete="off"
        />
        <label htmlFor="shop-product-effect">Effect (optional)</label>
        <input
          id="shop-product-effect"
          name="effect"
          value={form.effect}
          onChange={handleChange}
          placeholder="Effect (optional)"
          autoComplete="off"
        />
        <label htmlFor="shop-product-health">HP restore (valgfritt)</label>
        <input
          id="shop-product-health"
          name="health"
          value={form.health}
          onChange={handleChange}
          placeholder="HP restore (valgfritt)"
          type="number"
          min="0"
          autoComplete="off"
        />

        {/* Pet Food specific fields */}
        {form.category === "Pet Items" && (
          <>
            <label htmlFor="shop-product-pet-hp">Pet HP Restore %</label>
            <input
              id="shop-product-pet-hp"
              name="petHpRestore"
              value={form.petHpRestore}
              onChange={handleChange}
              placeholder="Pet HP Restore % (25, 50, 100)"
              type="number"
              min="0"
              max="100"
              autoComplete="off"
            />
            <label htmlFor="shop-product-bonus-time">Bonus feeding time (hours)</label>
            <input
              id="shop-product-bonus-time"
              name="bonusTime"
              value={form.bonusTime}
              onChange={handleChange}
              placeholder="Bonus feeding time in hours (valgfritt)"
              type="number"
              min="0"
              autoComplete="off"
            />
          </>
        )}

        {/* Image Upload Section */}
        <div style={{ marginTop: "1rem" }}>
          <span
            style={{
              display: "block",
              marginBottom: "0.5rem",
              fontWeight: "bold",
            }}
          >
            Product Image:
          </span>
          {form.image ? (
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: "0.5rem",
              }}
            >
              <img
                src={form.image}
                alt="Product preview"
                style={{
                  maxWidth: "150px",
                  maxHeight: "150px",
                  borderRadius: 0,
                  border: "2px solid #7B6857",
                  objectFit: "cover",
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
                  borderRadius: 0,
                  cursor: "pointer",
                }}
              >
                Remove image
              </button>
            </div>
          ) : (
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: "0.5rem",
              }}
            >
              <label htmlFor="shop-product-image" style={{ cursor: "pointer" }}>
                <input
                  id="shop-product-image"
                  name="productImage"
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  disabled={uploadingImage}
                  style={{ display: "none" }}
                />
                <span
                  style={{
                    display: "inline-block",
                    background: uploadingImage
                      ? "#666"
                      : "linear-gradient(135deg, #7B6857 0%, #8B7A6B 100%)",
                    color: "white",
                    padding: "0.75rem 1.5rem",
                    borderRadius: 0,
                    cursor: uploadingImage ? "not-allowed" : "pointer",
                    fontWeight: "600",
                    transition: "all 0.3s ease",
                  }}
                >
                  {uploadingImage ? "Uploading..." : "Choose Image"}
                </span>
              </label>
              <p style={{ color: "#7B6857", fontSize: "0.9rem", margin: "0" }}>
                Max size: 2MB. Recommended: 300x300px
              </p>
            </div>
          )}
        </div>

        <div style={{ display: "flex", gap: "10px" }}>
          <button
            type="submit"
            style={{
              background: editingProduct
                ? "linear-gradient(135deg, #8B7A6B 0%, #756357 100%)"
                : "linear-gradient(135deg, #7B6857 0%, #6B5B47 100%)",
              color: "#FFFFFF",
              border: "none",
              padding: "8px 16px",
              borderRadius: 0,
              fontSize: "14px",
              fontWeight: "500",
              cursor: "pointer",
              transition: "all 0.2s ease",
              boxShadow: "0 2px 6px rgba(123, 104, 87, 0.3)",
              textTransform: "capitalize",
              letterSpacing: "0.3px",
              minWidth: "120px",
            }}
            onMouseEnter={(e) => {
              e.target.style.transform = "translateY(-1px)";
              e.target.style.boxShadow = "0 4px 12px rgba(123, 104, 87, 0.4)";
            }}
            onMouseLeave={(e) => {
              e.target.style.transform = "translateY(0)";
              e.target.style.boxShadow = "0 2px 6px rgba(123, 104, 87, 0.3)";
            }}
          >
            {editingProduct ? "Update Product" : "Add Product"}
          </button>
          {editingProduct && (
            <button
              type="button"
              onClick={cancelEdit}
              style={{
                background: "linear-gradient(135deg, #A0927E 0%, #8B7A6B 100%)",
                color: "#FFFFFF",
                border: "none",
                padding: "8px 16px",
                borderRadius: 0,
                fontSize: "14px",
                fontWeight: "500",
                cursor: "pointer",
                transition: "all 0.2s ease",
                boxShadow: "0 2px 6px rgba(160, 146, 126, 0.3)",
                textTransform: "capitalize",
                letterSpacing: "0.3px",
                minWidth: "90px",
              }}
              onMouseEnter={(e) => {
                e.target.style.transform = "translateY(-1px)";
                e.target.style.boxShadow =
                  "0 4px 12px rgba(160, 146, 126, 0.4)";
              }}
              onMouseLeave={(e) => {
                e.target.style.transform = "translateY(0)";
                e.target.style.boxShadow = "0 2px 6px rgba(160, 146, 126, 0.3)";
              }}
            >
              Cancel
            </button>
          )}
        </div>
      </form>
      {status && (
        <div
          style={{
            marginTop: "16px",
            padding: "12px",
            background: "#E8DDD4",
            borderRadius: 0,
            color: "#5D4E37",
          }}
        >
          {status}
        </div>
      )}

      {/* Existing products */}
      <div
        style={{
          marginTop: "48px",
          padding: "24px",
          background: "#FEFEFE",
          borderRadius: 0,
          border: "1px solid #E8DDD4",
        }}
      >
        <h4
          style={{
            marginBottom: "24px",
            color: "#5D4E37",
            borderBottom: "2px solid #D4C4A8",
            paddingBottom: "12px",
          }}
        >
          Existing products (Firestore: {existingProducts.length}, Static:{" "}
          {
            staticShopItems.filter((product) => {
              const isConverted = existingProducts.some(
                (p) =>
                  p.originalId === product.id ||
                  (p.name === product.name && p.category === product.category)
              );
              return !isConverted;
            }).length
          }{" "}
          not converted)
        </h4>

        {/* Category filter – archivists only see Books */}
        <div
          style={{
            margin: "20px 0",
            padding: "16px",
            background: "#F9F6F1",
            borderRadius: 0,
            border: "1px solid #E8DDD4",
          }}
        >
          <label
            htmlFor="shop-category-filter"
            style={{
              display: "block",
              marginBottom: "8px",
              color: "#5D4E37",
              fontWeight: "500",
            }}
          >
            Filter by category:
          </label>
          {restrictToBooksOnly ? (
            <div style={{ padding: "8px 0", color: "#5D4E37" }}>Books only</div>
          ) : (
            <select
              id="shop-category-filter"
              name="categoryFilter"
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              style={{
                padding: "8px 12px",
                borderRadius: 0,
                border: "2px solid #D4C4A8",
                background: "#FFFFFF",
                color: "#2C2C2C",
                fontSize: "14px",
                width: "200px",
              }}
            >
              <option value="All">All Categories</option>
              {categories.map((category) => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </select>
          )}
        </div>

        {/* Firestore products (editable) */}
        <h5 style={{ color: "#7B6857", marginTop: "1rem" }}>
          Firestore Products (Editable)
        </h5>
        {existingProducts.filter(
            (product) =>
              (restrictToBooksOnly ? product.category === "Books" : true) &&
              (categoryFilter === "All" || product.category === categoryFilter)
        ).length === 0 && (
          <div style={{ color: "#8B7A6B", fontStyle: "italic" }}>
            {restrictToBooksOnly
              ? "No books in the shop yet."
              : "No Firestore products found for this category."}
          </div>
        )}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "1rem",
            maxHeight: "400px",
            overflowY: "auto",
            padding: "0.5rem",
            border: "1px solid #E8DDD4",
            borderRadius: 0,
            background: "#FEFEFE",
          }}
        >
          {existingProducts
            .filter(
              (product) =>
                (restrictToBooksOnly ? product.category === "Books" : true) &&
                (categoryFilter === "All" || product.category === categoryFilter)
            )
            .map((product) => (
              <div
                key={product.id}
                style={{
                  background: "#FFFFFF",
                  padding: "1rem",
                  borderRadius: 0,
                  border: "1px solid #D4C4A8",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <div
                  style={{ display: "flex", alignItems: "center", gap: "1rem" }}
                >
                  {product.image && (
                    <img
                      src={product.image}
                      alt={product.name}
                      style={{
                        width: "60px",
                        height: "60px",
                        borderRadius: 0,
                        objectFit: "cover",
                      }}
                    />
                  )}
                  <div>
                    <div style={{ fontWeight: "bold", color: "#2C2C2C" }}>
                      {product.name}
                    </div>
                    <div style={{ color: "#7B6857", fontSize: "0.9rem" }}>
                      {product.category} - {product.price} Nits
                    </div>
                    {product.description && (
                      <div style={{ color: "#8B7A6B", fontSize: "0.8rem" }}>
                        {product.description}
                      </div>
                    )}
                  </div>
                </div>
                <div style={{ display: "flex", gap: "0.5rem" }}>
                  <button
                    onClick={() => {
                      startEdit(product);
                    }}
                    style={{
                      background:
                        "linear-gradient(135deg, #4CAF50 0%, #45a049 100%)",
                      color: "white",
                      border: "none",
                      padding: "8px 16px",
                      borderRadius: 0,
                      cursor: "pointer",
                      fontSize: "14px",
                      fontWeight: "600",
                      transition: "all 0.2s ease",
                      boxShadow: "0 2px 8px rgba(76, 175, 80, 0.3)",
                      textTransform: "uppercase",
                      letterSpacing: "0.3px",
                    }}
                    onMouseEnter={(e) => {
                      e.target.style.transform = "translateY(-1px)";
                      e.target.style.boxShadow =
                        "0 4px 12px rgba(76, 175, 80, 0.4)";
                    }}
                    onMouseLeave={(e) => {
                      e.target.style.transform = "translateY(0)";
                      e.target.style.boxShadow =
                        "0 2px 8px rgba(76, 175, 80, 0.3)";
                    }}
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => {
                      deleteProduct(product.id, product);
                    }}
                    style={{
                      background:
                        "linear-gradient(135deg, #f44336 0%, #d32f2f 100%)",
                      color: "white",
                      border: "none",
                      padding: "8px 16px",
                      borderRadius: 0,
                      cursor: "pointer",
                      fontSize: "14px",
                      fontWeight: "600",
                      transition: "all 0.2s ease",
                      boxShadow: "0 2px 8px rgba(244, 67, 54, 0.3)",
                      textTransform: "uppercase",
                      letterSpacing: "0.3px",
                    }}
                    onMouseEnter={(e) => {
                      e.target.style.transform = "translateY(-1px)";
                      e.target.style.boxShadow =
                        "0 4px 12px rgba(244, 67, 54, 0.4)";
                    }}
                    onMouseLeave={(e) => {
                      e.target.style.transform = "translateY(0)";
                      e.target.style.boxShadow =
                        "0 2px 8px rgba(244, 67, 54, 0.3)";
                    }}
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
        </div>

        {/* Static products (read-only) – archivists only see Books */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginTop: "48px",
            marginBottom: "20px",
            paddingBottom: "12px",
            borderBottom: "2px solid #D4C4A8",
          }}
        >
          <h5 style={{ color: "#5D4E37", margin: 0, fontSize: "18px" }}>
            {restrictToBooksOnly
              ? "Static books (read-only)"
              : "Static products (read-only)"}
          </h5>
          {!restrictToBooksOnly && (
          <button
            onClick={convertAllStaticProducts}
            style={{
              background: "linear-gradient(135deg, #8B7A6B 0%, #756357 100%)",
              color: "white",
              border: "none",
              padding: "8px 16px",
              borderRadius: 0,
              cursor: "pointer",
              fontSize: "13px",
              fontWeight: "500",
              transition: "all 0.2s ease",
              boxShadow: "0 2px 6px rgba(123, 104, 87, 0.3)",
              textTransform: "capitalize",
              letterSpacing: "0.2px",
            }}
            onMouseEnter={(e) => {
              e.target.style.transform = "translateY(-1px)";
              e.target.style.boxShadow = "0 4px 12px rgba(123, 104, 87, 0.4)";
            }}
            onMouseLeave={(e) => {
              e.target.style.transform = "translateY(0)";
              e.target.style.boxShadow = "0 2px 6px rgba(123, 104, 87, 0.3)";
            }}
          >
            Convert all static products
          </button>
          )}
        </div>
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "1rem",
            maxHeight: "400px",
            overflowY: "auto",
            padding: "0.5rem",
            border: "1px solid #E8DDD4",
            borderRadius: 0,
            background: "#FEFEFE",
          }}
        >
          {staticShopItems
            .filter((product) => {
              if (restrictToBooksOnly && product.category !== "Books") return false;
              const isConverted = existingProducts.some(
                (p) =>
                  p.originalId === product.id ||
                  (p.name === product.name && p.category === product.category)
              );
              return !isConverted;
            })
            .filter(
              (product) =>
                categoryFilter === "All" || product.category === categoryFilter
            )
            .map((product) => (
              <div
                key={product.id}
                style={{
                  background: "#F9F6F1",
                  padding: "1rem",
                  borderRadius: 0,
                  border: "1px solid #E8DDD4",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  opacity: 0.7,
                }}
              >
                <div
                  style={{ display: "flex", alignItems: "center", gap: "1rem" }}
                >
                  {product.image && (
                    <img
                      src={product.image}
                      alt={product.name}
                      style={{
                        width: "60px",
                        height: "60px",
                        borderRadius: 0,
                        objectFit: "cover",
                      }}
                    />
                  )}
                  <div>
                    <div style={{ fontWeight: "bold", color: "#2C2C2C" }}>
                      {product.name}
                    </div>
                    <div style={{ color: "#7B6857", fontSize: "0.9rem" }}>
                      {product.category} - {product.price} Nits
                    </div>
                    {product.description && (
                      <div style={{ color: "#8B7A6B", fontSize: "0.8rem" }}>
                        {product.description}
                      </div>
                    )}
                  </div>
                </div>
                <div
                  style={{
                    display: "flex",
                    gap: "0.5rem",
                    alignItems: "center",
                  }}
                >
                  {existingProducts.find(
                    (p) =>
                      p.originalId === product.id ||
                      (p.name === product.name &&
                        p.category === product.category)
                  ) ? (
                    <div
                      style={{
                        color: "#4CAF50",
                        fontSize: "0.9rem",
                        fontWeight: "bold",
                      }}
                    >
                      ✓ Already converted
                    </div>
                  ) : (
                    <button
                      onClick={() => convertStaticToFirestore(product)}
                      style={{
                        background: "#7B6857",
                        color: "white",
                        border: "none",
                        padding: "0.5rem 1rem",
                        borderRadius: 0,
                        cursor: "pointer",
                        fontSize: "0.9rem",
                      }}
                    >
                      Konverter til Firestore
                    </button>
                  )}
                  <div
                    style={{
                      color: "#666",
                      fontSize: "0.9rem",
                      fontStyle: "italic",
                    }}
                  >
                    Statisk
                  </div>
                </div>
              </div>
            ))}
          {(() => {
            const nonConvertedItems = staticShopItems.filter((product) => {
              const isConverted = existingProducts.some(
                (p) =>
                  p.originalId === product.id ||
                  (p.name === product.name && p.category === product.category)
              );
              return !isConverted;
            });

            if (nonConvertedItems.length > 10) {
              return (
                <div
                  style={{
                    color: "#666",
                    fontStyle: "italic",
                    textAlign: "center",
                  }}
                >
                  ... and {nonConvertedItems.length - 10} more non-converted
                  static products
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
