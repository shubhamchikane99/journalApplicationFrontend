import React, { useState, useEffect, useContext } from "react";
import { postData } from "../services/apiService";
import Loader from "../components/Loader";
import moment from "moment"; // Import Moment.js
import { endPoint } from "../services/endPoint";
import { fetchData } from "../services/apiService";
import "../styles/JournalEntry.css"; // Import the CSS file
import { AuthContext } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import NavBar from "../components/Navbar";

const JournalEntry = () => {
  const [journal, setJournal] = useState({
    title: "",
    content: "",
    date: "",
  });
  const [journalEntries, setJournalEntries] = useState([]);
  const [loggedInUser, setLoggedInUser] = useState(null);
  const [loading, setLoading] = useState(false);

  const [error, setError] = useState(""); // State to manage errors

  // Handle input changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    setJournal({ ...journal, [name]: value });
  };

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem("user"));
    setLoggedInUser(user);
  }, []);

  //get All Journal Entry
  useEffect(() => {
    const fetchJournalEntry = async () => {
      if (!loggedInUser) return;

      setLoading(true);
      setError("");
      try {
        const data = await fetchData(
          `${endPoint.saveJournal}/by-user?userId=${loggedInUser.id}`
        );

        if (data.data) {
          setJournalEntries(data.data);
        }
      } catch (err) {
        setError("Failed to fetch Journal Entry. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    fetchJournalEntry();
  }, [loggedInUser]);

  // Function to save the journal entry
  const saveJournalEntry = async (JournalEntryPlayLoad) => {
    setLoading(true);
    try {
      // Send the journal entry to the server
      const data = await postData(endPoint.saveJournal, JournalEntryPlayLoad);

      if (data.error || data.data.error) {
        setError(data.data.errorMessage || "Failed to save journal entry.");
        return;
      }

      if (!data.error && data.data) {
        // Clear journal fields or update state after successful save
        setJournal({ title: "", content: "", date: "" });

        const data = await fetchData(
          `${endPoint.saveJournal}/by-user?userId=${loggedInUser.id}`
        );

        if (data.data) {
          setJournalEntries(data.data);
        }

        setLoading(false);
      }
    } catch (err) {
      setError("Failed to save journal entry. Please try again.");
    }
  };

  // Handle save button click
  const handleSave = () => {
    if (!journal.title || !journal.content || !journal.date) {
      setError("Please fill in all fields.");
      return;
    }
    const formattedDate = moment(journal.date).format("DD-MM-YYYY");
    const JournalEntryPlayLoad = {
      title: journal.title,
      content: journal.content,
      date: formattedDate,
    };

    // Call the save function
    saveJournalEntry(JournalEntryPlayLoad);
  };

  const { logout } = useContext(AuthContext); // Access user and logout
  const navigate = useNavigate(); // For redirection

  const handleLogout = () => {
    logout(); // Clear user data
    navigate("/"); // Redirect to Login page
  };

  return (
    <div>
      <NavBar onLogout={handleLogout} />
      <div className="journal-container">
        <h2 className="journal-heading">Save Journal Entry</h2>

        {/* Display error if any */}
        {error && <div className="error-message">{error}</div>}

        <input
          type="text"
          name="title"
          value={journal.title}
          onChange={handleChange}
          placeholder="Enter title"
          className="journal-input"
        />
        <p
          style={{
            textAlign: "right",
            fontSize: "16px",
            marginTop: "5px",
            fontFamily: "monospace",
            paddingBottom: "10px",
          }}
        >
          Characters: {journal.content.length} / 30000
        </p>
        <textarea
          name="content"
          value={journal.content}
          onChange={handleChange}
          placeholder="Write your journal here..."
          className="journal-textarea"
          maxLength={30000}
        />
        <input
          type="date"
          name="date"
          value={journal.date}
          onChange={handleChange}
          className="journal-input"
        />
        <button onClick={handleSave} className="journal-button">
          Save Journal Entry
        </button>
      </div>
      {/* ✅ Journal Entry Table added here */}
      {journalEntries.length > 0 && (
        <div className="journal-table-container">
          <h3 className="journal-table-heading">All Journal Entries</h3>
          {loading && <Loader />}

          <div className="journal-table-scroll-wrapper">
            <table className="journal-table">
              <thead>
                <tr>
                  <th>Title</th>
                  <th>Content</th>
                  <th>Date</th>
                </tr>
              </thead>
              <tbody>
                {journalEntries.map((entry, index) => (
                  <tr key={index}>
                    <td data-title={entry.title} aria-label={entry.title}>
                      {entry.title}
                    </td>
                    <td data-content={entry.content} aria-label={entry.content}>
                      <div style={{ maxHeight: "100px", overflowX: "auto" }}>
                        {entry.content}
                      </div>
                    </td>
                    <td data-date={entry.date} aria-label={entry.date}>
                      {entry.date}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default JournalEntry;
