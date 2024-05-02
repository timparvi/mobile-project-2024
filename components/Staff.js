import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, FlatList, Image } from 'react-native';
import { getDatabase, ref, onValue } from "firebase/database";
import { useNavigation } from '@react-navigation/native';

export default function Staff() {
  const navigation = useNavigation();
  const [employees, setEmployees] = useState([]);
  const [filteredEmployees, setFilteredEmployees] = useState([]);
  const [activeProfessions, setActiveProfessions] = useState({doctor: true, nurse: true, dentist: true});

  // Yhteys employees-tauluun ja haetaan työntekijöiden tiedot
  useEffect(() => {
    const db = getDatabase();
    const employeesRef = ref(db, '/employees/');
    onValue(employeesRef, snapshot => {
      const fetchedEmployees = [];
      snapshot.forEach(childSnapshot => {
        const employeeData = childSnapshot.val();
        fetchedEmployees.push({
          id: childSnapshot.key,
          employeeId: employeeData.employee_id,
          ...employeeData
        });
      });
      setEmployees(fetchedEmployees);
      filterEmployees(fetchedEmployees, activeProfessions);
    });
  }, []);

  // Nappuloiden tila. Boolean-arvo. Päivitetään newProfessions-objekti sen mukaisesti
  // prevState otettu Hooks API Reference dokkarista: https://legacy.reactjs.org/docs/hooks-reference.html
  // prevStaten avulla muutetaan annettu profession boolean arvo ja pidetään muut ennallaan
  const toggleProfession = (profession) => {
    setActiveProfessions(prevState => {
      const newProfessions = { ...prevState, [profession]: !prevState[profession] };
      filterEmployees(employees, newProfessions); // Uusi työntekijälistaus filterEmployees-funktiolle
      return newProfessions;
    });
  };

  const filterEmployees = (allEmployees, professions) => {
    const inactiveFilters = Object.entries(professions) // Muutetaan avain-arvo pareiksi ammatti + boolean
      .filter(([_profession, isActive]) => !isActive) // Seulotaan aktiiviset ammatit
      .map(([profession]) => profession); // Muutetaan aktiiviset ammatit listaksi
    const filtered = inactiveFilters.length > 0 
      ? allEmployees.filter(emp => !inactiveFilters.includes(emp.profession)) // Jätetään pois ammatit, jotka kuuluvat inactive-listaukseen
      : allEmployees;
    setFilteredEmployees(filtered);
  };

  return (
    <View style={styles.container}>
      <View style={styles.toggleContainer}>
        {['doctor', 'nurse', 'dentist'].map(profession => (
          <TouchableOpacity
            key={profession}
            style={activeProfessions[profession] ? styles.buttonActive : styles.buttonInactive}
            onPress={() => toggleProfession(profession)}>
            <Text style={styles.buttonText}>{profession.toUpperCase()}</Text>
          </TouchableOpacity>
        ))}
      </View>
      <FlatList
        data={filteredEmployees}
        keyExtractor={item => item.employeeId.toString()}
        renderItem={({ item }) => (
          <View style={styles.listItem}>
            <Image source={{ uri: item.picture }} style={styles.profilePic} />
            <View style={styles.infoContainer}>
              <Text style={styles.nameText}>{`${item.name} - ${item.profession}`}</Text>
              <Text style={styles.descriptionText}>{item.description}</Text>
              <Text style={styles.locationText}>{item.location}</Text>
            </View>
            <TouchableOpacity
              onPress={() => navigation.navigate('Booking', { selectedEmployeeId: item.employeeId })}
              style={styles.bookButton}>
              <Text style={styles.bookButtonText}>Book</Text>
            </TouchableOpacity>
          </View>
        )}
        style={styles.list}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  toggleContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginVertical: 20,
  },
  buttonActive: {
    margin: 10,
    padding: 12,
    backgroundColor: '#007bff',
    borderRadius: 5,
  },
  buttonInactive: {
    margin: 10,
    padding: 12,
    backgroundColor: '#ccc',
    borderRadius: 5,
  },
  buttonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
  listItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#ccc',
    width: '100%',
  },
  profilePic: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 10,
  },
  infoContainer: {
    flex: 1,
  },
  nameText: {
    fontSize: 16,
    color: '#2c3e50',
    fontWeight: 'bold',
  },
  descriptionText: {
    fontSize: 14,
    color: '#34495e',
  },
  locationText: {
    fontSize: 12,
    color: '#7f8c8d',
  },
  bookButton: {
    backgroundColor: '#60a3bc',
    padding: 10,
    borderRadius: 5,
  },
  bookButtonText: {
    color: 'white',
    fontWeight: 'bold',
  },
  list: {
    flex: 1,
    width: '100%',
  }
});
