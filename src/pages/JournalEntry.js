import React, { useState } from "react";
import { postData } from "../services/apiService";
import moment from "moment"; // Import Moment.js
import { endPoint } from "../services/endPoint"; 
import "../styles/JournalEntry.css"; // Import the CSS file

const JournalEntry = () => {
  const [journal, setJournal] = useState({
    title: "",
    content: "",
    date: "",
  });

  const [error, setError] = useState(""); // State to manage errors

  // Handle input changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    setJournal({ ...journal, [name]: value });
  };

  // Function to save the journal entry
  const saveJournalEntry = async (JournalEntryPlayLoad) => {
    try {
      // Send the journal entry to the server
      const data = await postData(endPoint.saveJournal,JournalEntryPlayLoad);

      if (data.error || data.data.error) {
        setError(data.data.errorMessage || "Failed to save journal entry.");
        return;
      }

      if (!data.error && data.data) {
        alert("Journal Entry Saved Successfully!");
        // Clear journal fields or update state after successful save
        setJournal({ title: "", content: "", date: "" });
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

  return (
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
      <textarea
        name="content"
        value={journal.content}
        onChange={handleChange}
        placeholder="Write your journal here..."
        className="journal-textarea"
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
  );
};

export default JournalEntry;
