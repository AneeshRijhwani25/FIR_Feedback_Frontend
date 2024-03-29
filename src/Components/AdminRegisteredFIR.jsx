"use client";
import React, { useState, useEffect } from "react";
const jwt = require("jsonwebtoken");
const backendUrl = process.env.BACKEND_URL;
const AdminRegisteredFIR = () => {
  const [registeredFIRs, setRegisteredFIRs] = useState([]);
  const [policeId, setPoliceId] = useState("");
  const [loading, setLoading] = useState(true);

  const fetchRegisteredFIRs = async () => {
    try {
      const token = localStorage.getItem("token");

      if (token) {
        try {
          const decodedToken = jwt.decode(token);
          setPoliceId(decodedToken.user._id);

          const response = await fetch(`${backendUrl}/fir/pol/${decodedToken.user._id}`);
          
          if (response.ok) {
            const data = await response.json();
            setRegisteredFIRs(data.data.firList);
          } else {
            console.error("Failed to fetch registered FIRs");
          }
        } catch (error) {
          console.error("Token decoding failed:", error.message);
        }
      } else {
        console.error("Token not found in localStorage");
      }
    } catch (error) {
      console.error("Error during FIR fetch:", error);
    } finally {
      // Set loading to false regardless of success or failure
      setLoading(false);
    }
  };
  useEffect(() => {

    fetchRegisteredFIRs();
  }, [/* Any additional dependencies you may need to include here */]);

  const handleResolveClick = async (firId) => {
    try {
      const response = await fetch(
        `${backendUrl}/fir/resolve/${firId}`,
        {
          method: "PUT",
        }
      );

      if (response.ok) {
        alert("FIR resolved successfully!");
        const fir = await fetch(`${backendUrl}/fir/${firId}`)
        const firdata = await fir.json();
        const {UserId} = firdata.data.fir
        console.log("Id",UserId)
        const smsResponse = await fetch("http://localhost:3005/sms/resolve", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            userId: UserId,
            firId: firId,
          }),
        });

        if (smsResponse.ok) {
          const smsData = await smsResponse.json();
          console.log("SMS sent successfully:", smsData);
        } else {
          console.error("Failed to send SMS:", smsResponse.statusText);
        }
        await fetchRegisteredFIRs();
      } else {
        const data = await response.json();
        console.error("FIR resolution failed:", data.message);
      }
    } catch (error) {
      console.error("Error during FIR resolution:", error);
    }
  };

  return (
    <div className="my-8">
      <h2 className="text-2xl font-bold mb-4 text-green-500">Registered FIRs</h2>
      {loading ? (
        <p>Loading...</p>
      ) : (
        <table className="min-w-full bg-white border border-green-800">
          <thead>
            <tr className="bg-gray-100">
              <th className="py-2 px-4 border-b border-green-800">FIR ID</th>
              <th className="py-2 px-4 border-b border-green-800">User ID</th>
              <th className="py-2 px-4 border-b border-green-800">Date</th>
              <th className="py-2 px-4 border-b border-green-800">Status</th>
            </tr>
          </thead>
          <tbody>
            {registeredFIRs.map((fir) => (
              <tr key={fir._id}>
                <td className="py-2 px-4 border-b border-green-800">{fir._id}</td>
                <td className="py-2 px-4 border-b border-green-800">{fir.UserId}</td>
                <td className="py-2 px-4 border-b border-green-800">{fir.Date.substring(0, 10)}</td>
                <td className="py-2 px-4 border-b border-green-800">
                  {fir.Status === "resolved" ? (
                    <span className="text-green-500">Resolved</span>
                  ) : (
                    <button
                      onClick={() => handleResolveClick(fir._id)}
                      className="bg-green-500 text-white px-2 py-1 rounded-full"
                    >
                      Resolve
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
};

export default AdminRegisteredFIR;