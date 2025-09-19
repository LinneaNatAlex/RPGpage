import React from "react";

const GeneralRules = () => {
  const rules = [
    "You must be 13 years or older to use this website.",
    "Show respect to all users.",
    "Treat everyone equally regardless of nationality, gender, sexuality, religion, or background.",
    "No bullying, harassment, or discrimination of any kind.",
    "No hate speech, threats, or incitement to violence.",
    "No spam, self-promotion, or advertising without permission.",
    "Do not impersonate staff or other users.",
    "Do not post or share malware, viruses, or malicious links.",
    "Do not encourage or glorify self-harm, suicide, or eating disorders.",
    "Do not post graphic violence or gore.",
    "Respect all staff and their decisions.",
    "Follow global laws and applicable guidelines.",
  ];

  return (
    <div
      style={{
        maxWidth: 900,
        margin: "40px auto",
        background: "linear-gradient(135deg, #5D4E37 0%, #6B5B47 100%)",
        color: "#F5EFE0",
        borderRadius: 20,
        padding: 40,
        boxShadow: "0 12px 48px rgba(0, 0, 0, 0.3), 0 4px 16px rgba(0, 0, 0, 0.2)",
        border: "3px solid #7B6857",
        position: "relative",
        overflow: "hidden",
      }}
    >
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          height: "4px",
          background: "linear-gradient(90deg, #D4C4A8 0%, #7B6857 50%, #D4C4A8 100%)",
          borderRadius: "20px 20px 0 0",
        }}
      />
      <h1 style={{ 
        textAlign: "center", 
        color: "#F5EFE0", 
        fontFamily: '"Cinzel", serif',
        fontSize: "2.5rem",
        fontWeight: 700,
        letterSpacing: "2px",
        textShadow: "0 2px 8px rgba(0, 0, 0, 0.3)",
        marginBottom: "2rem"
      }}>General Rules</h1>
      
      <div
        style={{
          background: "rgba(245, 239, 224, 0.1)",
          borderRadius: 16,
          padding: 24,
          border: "2px solid rgba(255, 255, 255, 0.2)",
          boxShadow: "0 4px 16px rgba(0, 0, 0, 0.2), inset 0 1px 3px rgba(255, 255, 255, 0.1)",
        }}
      >
        <ul style={{ 
          marginLeft: 20, 
          lineHeight: 1.6,
          fontSize: "1.1rem"
        }}>
          {rules.map((rule, index) => (
            <li key={index} style={{ marginBottom: 12, color: "#F5EFE0" }}>
              {rule}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default GeneralRules;
