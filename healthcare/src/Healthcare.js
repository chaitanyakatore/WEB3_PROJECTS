import React, { useState, useEffect } from "react";
import { ethers } from "ethers";
import contractABI from "./contractABI";
import "./Healthcare.css";

const Healthcare = () => {
  const [provider, setProvider] = useState(null);
  const [signer, setSigner] = useState(null);
  const [contract, setContract] = useState(null);
  const [account, setAccount] = useState(null);
  const [isOwner, setIsOwner] = useState(false);
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Form states
  const [patientID, setPatientID] = useState("");
  const [patientName, setPatientName] = useState("");
  const [diagnosis, setDiagnosis] = useState("");
  const [treatment, setTreatment] = useState("");
  const [medication, setMedication] = useState(""); // New state for medication
  const [providerAddress, setProviderAddress] = useState("");
  const [patientsRecord, setPatientsRecord] = useState([]);

  const contractAddress = process.env.REACT_APP_CONTRACT_ADDRESS;

  useEffect(() => {
    const connectWallet = async () => {
      if (!window.ethereum) {
        setError("MetaMask is required to use this application.");
        return;
      }

      try {
        setLoading(true);
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

        // Check if connected account is owner
        const ownerAddress = await contractInstance.owner();
        setIsOwner(accountAddress.toLowerCase() === ownerAddress.toLowerCase());

        // Check if connected account is authorized provider
        const isAuth = await contractInstance.isProviderAuthorized(
          accountAddress
        );
        setIsAuthorized(isAuth);
      } catch (error) {
        setError(`Error connecting to wallet: ${error.message}`);
      } finally {
        setLoading(false);
      }
    };

    connectWallet();
  }, [contractAddress]);

  const authorizeProvider = async () => {
    try {
      setLoading(true);
      setError("");
      if (!ethers.utils.isAddress(providerAddress)) {
        throw new Error("Invalid provider address");
      }

      const tx = await contract.authorizeProvider(providerAddress);
      await tx.wait();
      alert(`Provider ${providerAddress} authorized successfully`);
      setProviderAddress("");
    } catch (error) {
      setError(`Error authorizing provider: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const revokeProvider = async () => {
    try {
      setLoading(true);
      setError("");
      if (!ethers.utils.isAddress(providerAddress)) {
        throw new Error("Invalid provider address");
      }

      const tx = await contract.revokeProvider(providerAddress);
      await tx.wait();
      alert(`Provider ${providerAddress} authorization revoked successfully`);
      setProviderAddress("");
    } catch (error) {
      setError(`Error revoking provider: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const addPatientRecord = async () => {
    try {
      setLoading(true);
      setError("");
      if (
        !patientID ||
        !patientName ||
        !diagnosis ||
        !treatment ||
        !medication
      ) {
        throw new Error("All fields are required");
      }

      const tx = await contract.addMedicalRecord(
        patientID,
        patientName,
        diagnosis,
        treatment,
        medication
      );
      await tx.wait();
      alert("Patient record added successfully");

      // Clear form
      setPatientName("");
      setDiagnosis("");
      setTreatment("");
      setMedication("");
      await fetchPatientRecord();
    } catch (error) {
      setError(`Error adding patient record: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const fetchPatientRecord = async () => {
    try {
      setLoading(true);
      setError("");
      if (!patientID) {
        throw new Error("Patient ID is required");
      }

      const records = await contract.getMedicalRecords(patientID);
      setPatientsRecord(records);
    } catch (error) {
      setError(`Error fetching patient records: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="loading">Loading...</div>;
  }

  if (!isAuthorized) {
    return (
      <div className="container">
        <h1 className="title">Healthcare Records Management</h1>
        <p className="error-message">
          You are not authorized to access this application.
        </p>
        {account && (
          <p className="account-info">Connected Account: {account}</p>
        )}
      </div>
    );
  }

  return (
    <div className="container">
      <h1 className="title">Healthcare Records Management</h1>
      {account && <p className="account-info">Connected Account: {account}</p>}
      {isOwner && <p className="account-owner">You are the contract owner</p>}
      {error && <div className="error-message">{error}</div>}

      {isOwner && (
        <div className="form-section">
          <h2 className="section-title">Manage Healthcare Providers</h2>
          <input
            className="input-field"
            type="text"
            placeholder="Provider Address"
            value={providerAddress}
            onChange={(e) => setProviderAddress(e.target.value)}
          />
          <button
            className="action-button"
            onClick={authorizeProvider}
            disabled={loading || !providerAddress}
          >
            Authorize Provider
          </button>
          <button
            className="action-button"
            onClick={revokeProvider}
            disabled={loading || !providerAddress}
          >
            Revoke Provider
          </button>
        </div>
      )}

      <div className="form-section">
        <h2 className="section-title">Add Patient Records</h2>
        <input
          className="input-field"
          type="text"
          placeholder="Patient ID"
          value={patientID}
          onChange={(e) => setPatientID(e.target.value)}
        />
        <input
          className="input-field"
          type="text"
          placeholder="Patient Name"
          value={patientName}
          onChange={(e) => setPatientName(e.target.value)}
        />
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
        <input
          className="input-field"
          type="text"
          placeholder="Medication"
          value={medication}
          onChange={(e) => setMedication(e.target.value)}
        />
        <button
          className="action-button"
          onClick={addPatientRecord}
          disabled={
            loading ||
            !patientID ||
            !patientName ||
            !diagnosis ||
            !treatment ||
            !medication
          }
        >
          Add Patient Record
        </button>
      </div>

      <div className="form-section">
        <h2 className="section-title">View Patient Records</h2>
        <input
          className="input-field"
          type="text"
          placeholder="Patient ID"
          value={patientID}
          onChange={(e) => setPatientID(e.target.value)}
        />
        <button
          className="action-button"
          onClick={fetchPatientRecord}
          disabled={loading || !patientID}
        >
          Fetch Records
        </button>
      </div>

      {patientsRecord.length > 0 && (
        <div className="records-section">
          <h3 className="records-title">Patient Records:</h3>
          <ul className="records-list">
            {patientsRecord.map((record, index) => (
              <li key={index} className="record-item">
                <p>
                  <strong>Record ID:</strong> {record.recordId.toString()}
                </p>
                <p>
                  <strong>Patient Name:</strong> {record.name}
                </p>
                <p>
                  <strong>Diagnosis:</strong> {record.diagnosis}
                </p>
                <p>
                  <strong>Treatment:</strong> {record.treatment}
                </p>
                <p>
                  <strong>Medication:</strong> {record.medication}
                </p>
                <p>
                  <strong>Provider:</strong> {record.provider}
                </p>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default Healthcare;
