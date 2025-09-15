import { useState } from "react";
import { db } from "../../firebaseConfig";
import { collection, addDoc } from "firebase/firestore";

const categories = ["Books", "Potions", "Ingredients", "Equipment", "Food"];

export default function ShopProductAdmin() {
  const [form, setForm] = useState({
    name: "",
    category: "Food",
    price: "",
    description: "",
    effect: "",
    health: "",
  });
  const [status, setStatus] = useState("");

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus("");
    if (!form.name || !form.category || !form.price) {
      setStatus("Navn, kategori og pris er påkrevd.");
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
      await addDoc(collection(db, "shopItems"), docData);
      setStatus("Produkt lagt til!");
      setForm({
        name: "",
        category: "Food",
        price: "",
        description: "",
        effect: "",
        health: "",
      });
    } catch (err) {
      setStatus("Feil: " + err.message);
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
      <h3>Legg til nytt produkt i Shop</h3>
      <form
        onSubmit={handleSubmit}
        style={{ display: "flex", flexDirection: "column", gap: 10 }}
      >
        <input
          name="name"
          value={form.name}
          onChange={handleChange}
          placeholder="Navn"
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
          placeholder="Pris (Nits)"
          type="number"
          min="0"
        />
        <input
          name="description"
          value={form.description}
          onChange={handleChange}
          placeholder="Beskrivelse"
        />
        <input
          name="effect"
          value={form.effect}
          onChange={handleChange}
          placeholder="Effekt (valgfritt)"
        />
        <input
          name="health"
          value={form.health}
          onChange={handleChange}
          placeholder="HP restore (valgfritt)"
          type="number"
          min="0"
        />
        <button type="submit">Legg til produkt</button>
      </form>
      {status && <div style={{ marginTop: 8 }}>{status}</div>}
    </div>
  );
}
