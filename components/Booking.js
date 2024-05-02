import { StatusBar } from 'expo-status-bar';
import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, FlatList, TouchableOpacity, Alert } from 'react-native';
import { getAuth } from "firebase/auth";
import { getDatabase, ref, onValue, set, push } from "firebase/database";
import { useNavigation, useRoute } from '@react-navigation/native';
import { Dropdown } from 'react-native-element-dropdown';

const DAYS_OF_WEEK = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

export default function Booking() {
  const route = useRoute();
  const navigation = useNavigation();
  const [professions, setProfessions] = useState([]);
  const [locations, setLocations] = useState([]);
  const [allEmployees, setAllEmployees] = useState([]);
  const [filteredEmployees, setFilteredEmployees] = useState([]); 
  const [selectedProfession, setSelectedProfession] = useState(null);
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [selectedEmployeeId, setSelectedEmployeeId] = useState(null);
  const [selectedDate, setSelectedDate] = useState(null);
  const [availableTimes, setAvailableTimes] = useState([]);
  const [dates, setDates] = useState([]);
  const auth = getAuth();

  const resetFilters = () => {
    setSelectedProfession(null);
    setSelectedLocation(null);
    setSelectedEmployeeId(null);
    setSelectedDate(null);
    setAvailableTimes([]);
     setFilteredEmployees(allEmployees);
  };

  // Lisätään tiedot dropdown-valikkoihin, jos Staff.js tai Locations.js sivulta tulee tietoa
  useEffect(() => {
    if (route.params?.selectedEmployeeId) {
      setSelectedEmployeeId(route.params.selectedEmployeeId);
    }
    if (route.params?.selectedLocation) {
      setSelectedLocation(route.params.selectedLocation);
    }
  }, [route.params]);

  // Tehdään haku, jos työntekijä tai lokaatio tiedot on lisätty
  useEffect(() => {
    if (selectedEmployeeId || selectedLocation) {
      handleSearch();
    }
  }, [selectedEmployeeId, selectedLocation]);


  // Hakee työntekijätiedot tietokannasta dropdown-valikoita varten. Muokattu lähteestä https://firebase.google.com/docs/reference/node/firebase.database.DataSnapshot
  useEffect(() => {
    const dbRef = ref(getDatabase(), '/employees/');
    onValue(dbRef, (snapshot) => {
      const data = snapshot.val() || {};
      const professionSet = new Set();
      const locationSet = new Set();
      const employeeOptions = [];

      // Loopataan kaikki avaimet data-objektista lisätään työntekijän tiedot employeeOptions-array listaan (taulukkoon?)
      Object.keys(data).forEach(key => {
        const employee = data[key];
        if (employee.profession) professionSet.add(employee.profession);
        if (employee.location) locationSet.add(employee.location);
        if (employee.name && employee.employee_id) {
          employeeOptions.push({ label: employee.name, value: employee.employee_id, profession: employee.profession });
        }
      });

      // Päivitetään Professions, Locations ja AllEmployees useState-hookit
      setProfessions([{ label: 'All', value: 'All' }, ...Array.from(professionSet).map(profession => ({ label: profession, value: profession }))]);
      setLocations([{ label: 'All', value: 'All' }, ...Array.from(locationSet).map(location => ({ label: location, value: location }))]);
      setAllEmployees([{ label: 'All', value: 'All' }, ...employeeOptions]);
    }, { onlyOnce: true }); // Callback suoritetaan vain kerran
  }, []);

  // Filtteröintä jo annettujen arvojen perusteella
  useEffect(() => {
    const filtered = allEmployees.filter(employee => {
      return employee.value === 'All' || (selectedProfession ? employee.profession === selectedProfession : true);
    });
    setFilteredEmployees(filtered);
  }, [selectedProfession, allEmployees]);

  // Suoritetaan haku annetuilla tiedoilla tietokannasta
  const handleSearch = () => {
    const db = getDatabase();
    const employeesRef = ref(db, '/employees/');
    onValue(employeesRef, (snapshot) => {
        const matches = [];
        let availableDates = new Set();

        snapshot.forEach((childSnapshot) => {
            const employee = childSnapshot.val();

            // Filtteröidään tuloksia valittujen arvojen perusteella. Jos arvoja ei ole, näytetään kaikki
            const professionMatch = !selectedProfession || employee.profession === selectedProfession;
            const locationMatch = !selectedLocation || employee.location === selectedLocation;
            const employeeMatch = !selectedEmployeeId || employee.employee_id === selectedEmployeeId;

            // Tarkistetaan työntekijöiden saatavuus ja saatavilla olevat ajat lisätään matches-arrayihin
            if (employee.availability) {
                Object.keys(employee.availability).forEach(date => {
                    if (!selectedDate || selectedDate === date) {
                        availableDates.add(date);
                        const dayAvailability = employee.availability[date];
                        Object.entries(dayAvailability).forEach(([time, { status }]) => {
                            if (status === 'available' && professionMatch && locationMatch && employeeMatch) {
                                matches.push({
                                    key: `${employee.employee_id}-${time}`,
                                    time,
                                    name: employee.name,
                                    employeeId: employee.employee_id,
                                    date,
                                    dayIndex: DAYS_OF_WEEK.indexOf(date)
                                });
                            }
                        });
                    }
                });
            }
        });

        // Aikojen sorttaus viikonpäivien ja kellonaikojen mukaan
        const sortedDates = [...availableDates].sort((a, b) => DAYS_OF_WEEK.indexOf(a) - DAYS_OF_WEEK.indexOf(b));
        const sortedMatches = matches.sort((a, b) => {
            const dayComparison = a.dayIndex - b.dayIndex;
            if (dayComparison !== 0) return dayComparison;
            
            return a.time.localeCompare(b.time);
        });

        setDates(sortedDates);
        setAvailableTimes(sortedMatches);
    }, { onlyOnce: true });
};

  // Vahvistetaan varaus ja kutsutaan confirmBooking
  const handleBooking = (employeeId, name, date, time) => {
    Alert.alert(
      "Booking Confirmation",
      `Do you want to book ${name} at ${time}?`,
      [
        { text: "Cancel", style: "cancel" },
        { text: "Yes", onPress: () => confirmBooking(employeeId, date, time, name) }
      ]
    );
  };

  // Muutetaan varatun ajan tiedot tietokannassa
  const confirmBooking = (employeeId, date, time, name) => {
    console.log("confirmBooking date: " + date)
    const db = getDatabase();
    // Uuden uniikin avaimen luominen userBookings nodeen databasessa. Varmistetaan, että muut käyttäjät eivät pääse näkemään varausta
    const newBookingRef = push(ref(db, `userBookings/${auth.currentUser.uid}`));
    set(newBookingRef, {
      employee_id: employeeId,
      employeeName: name,
      date: date,
      time: time,
      status: 'booked'

      // Muutetaan status employee-taulussa 'available' -> 'booked'
    }).then(() => {
      const timeslotRef = ref(db, `/employees/${employeeId}/availability/${date}/${time}`);
      set(timeslotRef, { status: 'booked' });
      Alert.alert("Booking Successful", `You have booked ${name} at ${time} on ${date}.`);
      navigation.navigate('Home');
    }).catch(error => {
      console.error('Booking error:', error);
      Alert.alert("Booking Failed", "There was an issue confirming your booking. Please try again.");
    });
  };

  return (
    <View style={styles.container}>
      <Text style={styles.headerText}>Book appointment</Text>
      <Dropdown
        data={professions}
        labelField="label"
        valueField="value"
        placeholder="Select Profession"
        value={selectedProfession}
        onChange={item => {
          const newProfession = item.value === 'All' ? null : item.value;
          setSelectedProfession(newProfession);
          setSelectedEmployeeId(null); // Tyhjennetään kenttä, jos ammatti vaihtuu
        }}
        style={styles.dropdown}
      />
      <Dropdown
        data={locations}
        labelField="label"
        valueField="value"
        placeholder="Select Location"
        value={selectedLocation}
        onChange={item => setSelectedLocation(item.value === 'All' ? null : item.value)}
        style={styles.dropdown}
      />
      <Dropdown
        data={dates.map(date => ({ label: date, value: date })).concat([{ label: 'All', value: 'All' }])}
        labelField="label"
        valueField="value"
        placeholder="Select Date"
        value={selectedDate}
        onChange={item => setSelectedDate(item.value === 'All' ? null : item.value)}
        style={styles.dropdown}
      />
      <Dropdown
        data={filteredEmployees}
        labelField="label"
        valueField="value"
        placeholder="Select Employee"
        value={selectedEmployeeId}
        onChange={item => setSelectedEmployeeId(item.value === 'All' ? null : item.value)}
        style={styles.dropdown}
      />
      <TouchableOpacity style={styles.button} onPress={handleSearch}>
        <Text style={styles.buttonText}>Search Availability</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.buttonSecondary} onPress={resetFilters}>
        <Text style={styles.buttonText}>Reset Filters</Text>
      </TouchableOpacity>
      
      <FlatList
  data={availableTimes}
  keyExtractor={item => `${item.employeeId}-${item.time}`}
  renderItem={({ item }) => (
    <View style={styles.listItem}>
      <View style={styles.dateTimeContainer}>
        <Text style={styles.dateText}>{item.date}</Text>
        <Text style={styles.timeText}>{item.time}</Text>
      </View>
      <View style={styles.nameContainer}>
        <Text style={styles.nameText}>{item.name}</Text>
      </View>
      <TouchableOpacity 
        style={styles.bookButtonContainer}
        onPress={() => handleBooking(item.employeeId, item.name, item.date, item.time)}>
        <Text style={styles.bookButtonText}>Book</Text>
      </TouchableOpacity>
    </View>
  )}
  style={styles.list}
/>
      <StatusBar style="auto" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 50,
    paddingHorizontal: 20,
    backgroundColor: '#fff',
  },
  headerText: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 20,
    color: '#27496d',
  },
  dropdown: {
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 5,
    paddingVertical: 8,
    paddingHorizontal: 10,
    backgroundColor: 'white',
  },
  button: {
    backgroundColor: '#007bff', 
    padding: 12,
    borderRadius: 5,
    alignItems: 'center',
    marginBottom: 10,
  },
  buttonSecondary: {
    backgroundColor: '#60a3bc',
    padding: 12,
    borderRadius: 5,
    alignItems: 'center',
    marginBottom: 20,
  },
  buttonText: {
    color: 'white',
    fontWeight: 'bold'
  },
  listItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#ccc',
  },
  bookButton: {
    color: '#007bff',
    textDecorationLine: 'underline'
  },
  list: {
    flex: 1,
  },
  dateTimeContainer: {
    flex: 3,
    flexDirection: 'column',
    justifyContent: 'space-around',
  },
  dateText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  timeText: {
    fontSize: 14,
    color: '#666',
  },
  nameContainer: {
    flex: 4,
    justifyContent: 'center',
    paddingLeft: 10,
  },
  nameText: {
    fontSize: 16,
    color: '#27496d',
  },
  bookButtonContainer: {
    flex: 2,
    backgroundColor: '#007bff',
    borderRadius: 5,
    padding: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  bookButtonText: {
    color: 'white',
    fontWeight: 'bold',
  },
});