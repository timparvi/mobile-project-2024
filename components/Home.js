import { StatusBar } from 'expo-status-bar';
import React, { useState, useEffect } from 'react';
import { getAuth } from "firebase/auth";
import { getDatabase, ref, onValue, set } from "firebase/database";
import { StyleSheet, Text, View, FlatList, Alert, TouchableOpacity } from 'react-native';

// Kotisivu. Näyttää varatut ajat ja mahdollistaa aikojen peruutuksen. Käyetty apuna Firebase-dokumentaatiota

export default function Home() {
  const [appointments, setAppointments] = useState([]);
  const [firstName, setFirstName] = useState('');
  const auth = getAuth();
  const db = getDatabase();

  useEffect(() => {
    const currentUser = auth.currentUser;
    if (!currentUser) {
      return;
    }

    // Haetaan käyttäjän etunimi. onValue-kuuntelu
    const userRef = ref(db, `users/${currentUser.uid}`);
    onValue(userRef, (snapshot) => {
      const userData = snapshot.val();
      if (userData) {
        setFirstName(userData.firstName);
      }
    });

    // Haetaan käyttäjän varatut ajat
    const userAppointmentsRef = ref(db, `userBookings/${currentUser.uid}`);
    const unsubscribe = onValue(userAppointmentsRef, (snapshot) => {
      const fetchedAppointments = [];
      snapshot.forEach((childSnapshot) => {
          const appointmentData = childSnapshot.val();
          fetchedAppointments.push({
              key: childSnapshot.key,
              employeeKey: appointmentData.employee_id,
              ...appointmentData
          });
      });
      setAppointments(fetchedAppointments);
  });

    return () => unsubscribe();
  }, []);

  // Peruutuksen popup ikkuna ja confirm cancellation kutsu
  const cancelAppointment = (appointmentKey, employeeKey, date, time) => {
    Alert.alert(
      "Cancel Appointment",
      "Are you sure you want to cancel this appointment?",
      [
        {
          text: "No",
          style: "cancel"
        },
        {
          text: "Yes",
          onPress: () => confirmCancellation(appointmentKey, employeeKey, date, time)
        }
      ]
    );
  };

  // Peruutuksen vahvistus
  const confirmCancellation = (appointmentKey, employeeKey, date, time) => {
    const userAppointmentRef = ref(db, `userBookings/${auth.currentUser.uid}/${appointmentKey}`);
    set(userAppointmentRef, null);  // Poistetaan varaus

    // Päivitetään employee-taulu
    const timeslotRef = ref(db, `/employees/${employeeKey}/availability/${date}/${time}`);
    set(timeslotRef, { status: 'available' })
    .then(() => {
        Alert.alert("Cancellation Successful", "Your appointment has been cancelled.");
    })
    .catch(error => {
        console.error('Cancellation error:', error);
        Alert.alert("Cancellation Failed", "There was an issue canceling your booking. Please try again.");
    });
};

  return (
    <View style={styles.container}>
      <Text style={styles.welcome}>Welcome, {firstName}!</Text>
      <Text style={styles.header}>Here are your upcoming appointments:</Text>
      <FlatList
        data={appointments}
        renderItem={({ item }) => (
          <View style={styles.appointment}>
            <Text style={styles.employeeName}>{item.employeeName}</Text>
            <Text>{item.date} at {item.time}</Text>
            <TouchableOpacity style={styles.button} onPress={() => cancelAppointment(item.key, item.employeeKey, item.date, item.time)}>
              <Text style={styles.buttonText}>Cancel Appointment</Text>
            </TouchableOpacity>
          </View>
        )}
      />
      <StatusBar style="auto" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    padding: 20,
  },
  welcome: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 10
  },
  header: {
    fontSize: 16,
    color: '#2c3e50',
    marginBottom: 10
  },
  appointment: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
    width: '100%',
    backgroundColor: '#f0f0f0',
    marginBottom: 10,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 1.5,
    elevation: 2,
  },
  employeeName: {
    fontWeight: 'bold',
    color: '#2c3e50'
  },
  button: {
    backgroundColor: 'blue',
    padding: 10,
    marginTop: 10,
    borderRadius: 5,
    alignItems: 'center',
  },
  buttonText: {
    color: 'white',
    fontWeight: 'bold'
  }
});

