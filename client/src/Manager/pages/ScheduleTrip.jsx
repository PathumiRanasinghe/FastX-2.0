import React, { useState, useEffect } from "react";
import axios from "axios";
import Sidebar from "../components/Sidebar";

const ScheduleTrip = () => {
  const [driverData, setDriverData] = useState([]);
  const [assistantData, setAssistantData] = useState([]);
  const [truckData, setTruckData] = useState([]);
  const [routeData, setRouteData] = useState([]);
  const [orderData, setOrderData] = useState([]); // State for orders
  const [activePage, setActivePage] = useState("Schedule a New Trip");

  const [selectedDriver, setSelectedDriver] = useState("");
  const [selectedAssistant, setSelectedAssistant] = useState("");
  const [selectedTruck, setSelectedTruck] = useState("");
  const [selectedStore, setSelectedStore] = useState("");
  const [selectedRoute, setSelectedRoute] = useState("");
  const [selectedOrders, setSelectedOrders] = useState([]); // State for selected orders
  const [totalCapacity, setTotalCapacity] = useState(0); // State for total capacity
  const [startTime, setStartTime] = useState(""); // State for start time
  const [warning, setWarning] = useState(""); // Warning message for capacity
  const [formVisible, setFormVisible] = useState(false); // State to control form visibility

  const handleNavigation = (item) => {
    setActivePage(item);
  };

  useEffect(() => {
    loadOrdersByStore();
  }, []);

  const loadOrdersByStore = async () => {
    try {
      const response = await axios.get(
        `http://localhost:8080/manager/getstoreorders`,
        { withCredentials: true }
      );
      console.log("API Response for orders:", response.data);
      setOrderData(response.data);
    } catch (error) {
      console.error("Error loading orders", error);
    }
  };

  const loadTrucksByStore = async () => {
    try {
      const response = await axios.get(
        `http://localhost:8080/manager/gettruck`,
        { withCredentials: true }
      );
      setTruckData(response.data);
    } catch (error) {
      console.error("Error loading trucks", error);
    }
  };

  const loadRoutesByStore = async () => {
    try {
      const response = await axios.get(
        `http://localhost:8080/manager/getroute`,
        { withCredentials: true }
      );
      setRouteData(response.data);
    } catch (error) {
      console.error("Error loading routes", error);
    }
  };

  const loadDriversByStore = async () => {
    try {
      const response = await axios.get(
        `http://localhost:8080/manager/getdriver`,
        { withCredentials: true }
      );
      setDriverData(response.data);
    } catch (error) {
      console.error("Error loading drivers", error);
    }
  };

  const loadAssistantsByStore = async () => {
    try {
      const response = await axios.get(
        `http://localhost:8080/manager/getdriverassistant`,
        { withCredentials: true }
      );
      setAssistantData(response.data);
    } catch (error) {
      console.error("Error loading assistants", error);
    }
  };

  const handleOrderSelection = (orderId, capacity) => {
    const intCapacity = Math.floor(capacity); // Convert capacity to integer

    setSelectedOrders((prevOrders) => {
      const isSelected = prevOrders.includes(orderId);
      const newTotalCapacity = isSelected
        ? totalCapacity - intCapacity
        : totalCapacity + intCapacity;

      // Check capacity limit
      if (!isSelected && newTotalCapacity > 50000) {
        setWarning(
          `Cannot select order! This will exceed the capacity limit of 500. Current capacity: ${newTotalCapacity}`
        );
        return prevOrders;
      }

      setWarning("");
      setTotalCapacity(newTotalCapacity); // Update total capacity here

      // Return new list of selected orders
      return isSelected
        ? prevOrders.filter((id) => id !== orderId)
        : [...prevOrders, orderId];
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const scheduleData = {
      truck_ID: selectedTruck,
      driver_ID: selectedDriver,
      assistant_ID: selectedAssistant,
      store_ID: selectedStore,
      route_ID: selectedRoute,
      start_time: startTime,
      selectedOrders: selectedOrders,
    };

    console.log("Selected orders before submission:", selectedOrders);

    try {
      const response = await axios.post(
        "http://localhost:8080/manager/scheduletrip",
        scheduleData,
        { withCredentials: true }
      );
      alert("Trip scheduled successfully!");
      console.log("Response:", response.data);

      // Resetting the form to initial state
    setSelectedDriver("");
    setSelectedAssistant("");
    setSelectedTruck("");
    setSelectedStore("");
    setSelectedRoute("");
    setSelectedOrders([]);
    setTotalCapacity(0);
    setStartTime("");
    setWarning("");
    setFormVisible(false); 

    loadOrdersByStore();
    } catch (error) {
      if (error.response) {
        alert(error.response.data.message);
      } else {
        alert("An error occurred while scheduling the trip.");
      }
      console.error("Error scheduling the trip", error);
    }
  };

  const handleNextStep = () => {
    if (selectedOrders.length === 0 || !startTime) {
      alert("Please select orders and provide a start time.");
    } else {
      loadDriversByStore();
      loadAssistantsByStore();
      loadTrucksByStore();
      loadRoutesByStore();
      setFormVisible(true); // Show the rest of the form
    }
  };

  const [maxTimeOfRoute, setMaxTimeOfRoute] = useState(0);

  const isDriverResting = (lastTripEndTime) => {
    const restTimeInMilliseconds = 60 * 60 * 1000; // 1 hour in milliseconds
    const now = new Date();
    const lastTripEnd = new Date(lastTripEndTime);

    return now - lastTripEnd < restTimeInMilliseconds;
  };

  const isDriverAssistantResting = (lastTripEndTime) => {
    const restTimeInMilliseconds = 60 * 60 * 1000; // 1 hour in milliseconds
    const now = new Date();
    const lastTripEnd = new Date(lastTripEndTime);

    return now - lastTripEnd < restTimeInMilliseconds;
  };

  return (
    <div className="flex min-h-screen bg-gradient-to-r from-purple-100 to-blue-100">
      {/* Sidebar */}
      <Sidebar
        activePage={activePage}
        setActivePage={setActivePage}
        handleNavigation={handleNavigation}
      />

      {/* Main Content */}
      <div className="w-3/4 p-8">
        <div className="flex justify-center mb-8">
          <h1 className="text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-purple-800 to-blue-800">
            Schedule A Trip
          </h1>
        </div>

        <div className="mb-4">
  <div className="flex items-center justify-between mb-4">
    <span className="text-xl font-bold ml-2">Loading Packages</span>
  </div>

  {/* Orders and capacity selection in table format */}
  <div className="overflow-auto bg-white rounded-lg shadow">
    <table className="min-w-full bg-white border border-gray-300">
      <thead>
        <tr className="bg-gradient-to-r from-purple-500 to-blue-500 text-white">
          <th className="px-4 py-2 border-b font-semibold text-left">Order ID</th>
          <th className="px-4 py-2 border-b font-semibold text-left">Route ID</th>
          <th className="px-4 py-2 border-b font-semibold text-left">Capacity</th>
          <th className="px-4 py-2 border-b font-semibold text-center">Select</th>
        </tr>
      </thead>
      <tbody>
        {orderData.length > 0 ? (
          orderData.map((order) => (
            <tr
              key={order.order_id}
              className={`border-b hover:bg-gray-100 ${
                selectedOrders.includes(order.order_id) ? 'bg-green-100' : ''
              }`}
            >
              <td className="px-4 py-2 text-gray-600">{order.order_id}</td>
              <td className="px-4 py-2 text-gray-600">{order.route_id}</td>
              <td className="px-4 py-2 text-gray-600">{order.capacity}</td>
              <td className="px-4 py-2 text-center">
                <input
                  type="checkbox"
                  checked={selectedOrders.includes(order.order_id)}
                  onChange={() => handleOrderSelection(order.order_id, order.capacity)}
                  disabled={selectedRoute && selectedRoute !== order.route_id}
                  className="h-5 w-5 text-green-600 rounded focus:ring-green-500 cursor-pointer"
                />
              </td>
            </tr>
          ))
        ) : (
          <tr>
            <td colSpan="4" className="px-4 py-2 text-center text-gray-500">No orders found for the selected store.</td>
          </tr>
        )}
      </tbody>
    </table>
  </div>

  {/* Warning Message */}
  {warning && <div className="text-red-500 text-sm mt-2">{warning}</div>}

  {/* Progress Bar for Capacity */}
  <div className="mt-4">
    <div className="relative h-4 bg-gray-200 rounded-full overflow-hidden">
      <div
        className="absolute top-0 left-0 h-full bg-green-500 transition-all"
        style={{ width: `${(totalCapacity / 50000) * 100}%` }}
      ></div>
    </div>
    <div className="mt-2 text-sm text-gray-600">
      Total Capacity Selected: {totalCapacity} / 50,000
    </div>
  </div>
</div>


        {/* Start Time Input */}
        <div className="mb-4">
          <label htmlFor="start_time" className="block font-bold mb-1">
            Trip Start Time:
          </label>
          <input
            type="time"
            id="start_time"
            value={startTime}
            onChange={(e) => setStartTime(e.target.value)}
            className="w-full px-3 py-2 border rounded-lg"
            required
          />
        </div>

        {/* Next Button */}
        <button
          className="px-4 py-2 bg-blue-500 text-white font-semibold rounded hover:bg-blue-700"
          onClick={handleNextStep}
        >
          Next
        </button>

        {/* Conditional Form */}
        {formVisible && (
          <form onSubmit={handleSubmit}>
            {/* Truck Selection */}
            <div className="mb-4">
              <label htmlFor="truck" className="block font-bold mb-1">
                Truck:
              </label>
              <select
                value={selectedTruck}
                onChange={(e) => setSelectedTruck(e.target.value)}
                className="w-full px-3 py-2 border rounded-lg"
                required
              >
                <option value="">-- Select Truck --</option>
                {truckData.map((truck) => (
                  <option
                    key={truck.truck_ID}
                    value={truck.truck_ID}
                    disabled={truck.status !== "inactive"}
                  >
                    {`${truck.truck_ID} - capacity ${truck.capacity}`}
                    {truck.status === "inactive" ? "" : "(active)"}
                  </option>
                ))}
              </select>
            </div>

            {/* Route Selection */}
            <div className="mb-4">
              <label htmlFor="route" className="block font-bold mb-1">
                Route:
              </label>
              <select
                value={selectedRoute}
                onChange={(e) => setSelectedRoute(e.target.value)}
                className="w-full px-3 py-2 border rounded-lg"
                required
              >
                <option value="">-- Select Route --</option>
                {routeData.map((route) => (
                  <option key={route.route_ID} value={route.route_ID}>
                    {route.route_ID}
                  </option>
                ))}
              </select>
            </div>

            {/* Driver Selection */}
            <div className="mb-4">
              <label htmlFor="driver" className="block font-bold mb-1">
                Driver:
              </label>
              <select
                value={selectedDriver}
                onChange={(e) => setSelectedDriver(e.target.value)}
                className="w-full px-3 py-2 border rounded-lg"
                required
              >
                <option value="">-- Select Driver --</option>
                {driverData.map((driver) => {
                  const isResting = isDriverResting(driver.last_trip_end_time);
                  const totalDriverHours =
                    driver.current_working_time + maxTimeOfRoute;

                  return (
                    <option
                      key={driver.driver_ID}
                      value={driver.driver_ID}
                      disabled={
                        driver.status !== "inactive" || totalDriverHours >= 40
                      }
                    >
                      {`${driver.driver_ID} - worked ${
                        driver.current_working_time
                      } hrs ${isResting ? "(resting)" : ""}`}
                      {driver.status === "inactive" ? "" : "(active)"}
                    </option>
                  );
                })}
              </select>
            </div>

            {/* Assistant Selection */}
            <div className="mb-4">
              <label htmlFor="assistant" className="block font-bold mb-1">
                Driver Assistant:
              </label>
              <select
                value={selectedAssistant}
                onChange={(e) => setSelectedAssistant(e.target.value)}
                className="w-full px-3 py-2 border rounded-lg"
                required
              >
                <option value="">-- Select Driver Assistant --</option>
                {assistantData.map((assistant) => {
                  const isResting = isDriverAssistantResting(
                    assistant.last_trip_end_time
                  );
                  const totalAssistantHours =
                    assistant.current_working_time + maxTimeOfRoute;

                  return (
                    <option
                      key={assistant.assistant_ID}
                      value={assistant.assistant_ID}
                      disabled={
                         (assistant.status === "active1" || assistant.status === "active2") || totalAssistantHours > 60
                      }
                    >
                      {`${assistant.assistant_ID} - worked ${
                        assistant.current_working_time
                      } hrs ${
                        isResting && assistant.status === "inactive"
                          ? "(resting)"
                          : ""
                      }`}
                      {assistant.status === "inactive" ? "" : `(${assistant.status})`}
                    </option>
                  );
                })}
              </select>
            </div>

            {/* Submit Button */}
            <div className="mb-4">
              <button
                type="submit"
                className="w-full px-4 py-2 bg-green-500 text-white font-semibold rounded-lg hover:bg-green-700"
              >
                Schedule Trip
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default ScheduleTrip;
