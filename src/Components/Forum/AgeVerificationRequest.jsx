export default function AgeVerificationRequest() {
  return (
    <div
      style={{
        maxWidth: 500,
        margin: "2rem auto",
        background: "#23232b",
        padding: 32,
        borderRadius: 16,
        color: "#fff",
        textAlign: "center",
      }}
    >
      <h2 style={{ color: "#ffd86b", marginBottom: 16 }}>18+ Forum Access</h2>
      <p style={{ marginBottom: 24 }}>
        To access the <b>18+ forum</b>, you must first be approved by an admin.
        <br />
        <b>Step 1:</b> Join our Discord server and enter the <b>18+</b> channel:
        <br />
        <a
          href="https://discord.gg/b3qm3phc"
          target="_blank"
          rel="noopener noreferrer"
          style={{ color: "#6bc1ff", fontWeight: 700 }}
        >
          https://discord.gg/b3qm3phc
        </a>
      </p>
      <p style={{ marginBottom: 24 }}>
        <b>Step 2:</b> Write a short message in the 18+ channel to request
        access.
        <br />
        An admin will manually approve you after checking that you have access
        to the 18+ Discord channel.
        <br />
        Once approved, you will get access to the <b>18+ forum</b> here on the
        website.
      </p>
      <div
        style={{
          background: "#333",
          padding: 16,
          borderRadius: 8,
          color: "#ffd86b",
          fontWeight: 500,
        }}
      >
        You do not have access to the <b>18+ forum</b> yet. Please contact an
        admin on Discord to get approved.
      </div>
    </div>
  );
}
