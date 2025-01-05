import React, { useState, useEffect } from "react";
import { ethers } from "ethers";
import "./Healthcare.css";

const Healthcare = () => {
  const [provider, setProvider] = useState(null);
  const [signer, setSigner] = useState(null);
  const [contract, setContract] = useState(null);
  const [account, setAccount] = useState(null);
  const [isOwner, setIsOwner] = useState(false);
  const [patientID, setPatientID] = useState("");
  const [diagnosis, setDiagnosis] = useState("");
  const [treatment, setTreatment] = useState("");
  const [providerAddress, setProviderAddress] = useState("");
  const [patientsRecord, setPatientsRecord] = useState([]);

  const contractAddress = process.env.REACT_APP_CONTRACT_ADDRESS;
  const contractABI = [
    // Contract ABI here (unchanged)
  ];

  useEffect(() => {
    const connectWallet = async () => {
      if (!window.ethereum) {
        alert("MetaMask is required to use this application.");
        return;
      }

      try {
        const web3Provider = new ethers.providers.Web3Provider(window.ethereum);
        await web3Provider.send("eth_requestAccounts", []);
        const signer = web3Provider.getSigner();
        const accountAddress = await signer.getAddress();

        setProvider(web3Provider);
        setSigner(signer);
        setAccount(accountAddress);

        const contractInstance = new ethers.Contract(
          contractAddress,
          contractABI,
          signer
        );
        setContract(contractInstance);

        const ownerAddress = await contractInstance.getOwner();
        setIsOwner(accountAddress.toLowerCase() === ownerAddress.toLowerCase());
      } catch (error) {
        console.error("Error connecting to wallet:", error);
      }
    };

    connectWallet();
  }, []);

  const fetchPatientRecord = async () => {
    try {
      const records = await contract.getPatientRecords(patientID);
      setPatientsRecord(records);
    } catch (error) {
      console.error("Error fetching patient records:", error);
    }
  };

  const authorizeProvider = async () => {
    if (!isOwner) {
      alert("Only the contract owner can authorize providers.");
      return;
    }

    try {
      const tx = await contract.authorizedProvider(providerAddress);
      await tx.wait();
      alert(`Provider ${providerAddress} authorized successfully.`);
    } catch (error) {
      console.error("Error authorizing provider:", error);
    }
  };

  const addPatientRecord = async () => {
    try {
      const tx = await contract.addRecords(
        patientID,
        "Alice",
        diagnosis,
        treatment
      );
      await tx.wait();
      alert("Patient record added successfully.");
      fetchPatientRecord();
    } catch (error) {
      console.error("Error adding patient record:", error);
    }
  };

  return (
    <div className="container">
      <h1 className="title">HealthCare</h1>
      {account && <p className="account-info">Connected Account: {account}</p>}
      {isOwner && <p className="account-owner">You are the contract owner.</p>}

      <div className="form-section">
        <h2 className="section-title">Fetch Patient Records</h2>
        <input
          className="input-field"
          type="text"
          placeholder="Enter Patient ID"
          value={patientID}
          onChange={(e) => setPatientID(e.target.value)}
        />
        <button className="action-button" onClick={fetchPatientRecord}>
          Fetch Patient Record
        </button>
      </div>

      <div className="form-section">
        <h2 className="section-title">Add Patient Records</h2>
        <input
          className="input-field"
          type="text"
          placeholder="Diagnosis"
          value={diagnosis}
          onChange={(e) => setDiagnosis(e.target.value)}
        />
        <input
          className="input-field"
          type="text"
          placeholder="Treatment"
          value={treatment}
          onChange={(e) => setTreatment(e.target.value)}
        />
        <button className="action-button" onClick={addPatientRecord}>
          Add Patient Record
        </button>
      </div>

      <div className="form-section">
        <h2 className="section-title">Authorize Healthcare Providers</h2>
        <input
          className="input-field"
          type="text"
          placeholder="Provider Address"
          value={providerAddress}
          onChange={(e) => setProviderAddress(e.target.value)}
        />
        <button className="action-button" onClick={authorizeProvider}>
          Authorize Provider
        </button>
      </div>

      {patientsRecord.length > 0 && (
        <div className="records-section">
          <h3 className="records-title">Patient Records:</h3>
          <ul className="records-list">
            {patientsRecord.map((record, index) => (
              <li key={index} className="record-item">
                <strong>Record ID:</strong> {record.recordID},{" "}
                <strong>Diagnosis:</strong> {record.diagnosis},{" "}
                <strong>Treatment:</strong> {record.treatment}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default Healthcare;
