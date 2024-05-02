import React, { useState, useEffect } from 'react';
import { StyleSheet, View, TouchableOpacity, Text, ScrollView } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { signOut } from 'firebase/auth';
import { auth } from '../firebase-config';
import { getDatabase, ref, onValue, update } from 'firebase/database';
import { Input, Button, Card } from '@rneui/themed';

export default function Settings() {
  const [editing, setEditing] = useState(false);
  const [userInfo, setUserInfo] = useState({
    firstName: '',
    lastName: '',
    address: '',
    city: ''
  });

  // Haetaan käyttäjän tiedot Firebasesta
  useEffect(() => {
    const userRef = ref(getDatabase(), 'users/' + auth.currentUser.uid);
    onValue(userRef, (snapshot) => {
      if (snapshot.exists()) {
        setUserInfo(snapshot.val());
      }
    });
  }, []);

  // Uloskirjautuminen signoutilla. Otettu suoraan firebasen dokumentaatiosta: https://firebase.google.com/docs/auth/web/password-auth
  const handleLogout = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error('Logout failed: ', error);
    }
  };

  // Tallennetaan tiedot users-tauluun
  const handleSave = () => {
    const db = getDatabase();
    const updates = {};
    updates['/users/' + auth.currentUser.uid] = userInfo;
    update(ref(db), updates).then(() => {
      setEditing(false);
    }).catch((error) => {
      console.error('Update failed: ', error);
    });
  };

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollView}>
        <Card containerStyle={styles.card}>
          <Card.Title>Contact Information</Card.Title>
          <Card.Divider />
          {editing ? (
            <>
              <Input value={userInfo.firstName} onChangeText={(text) => setUserInfo({...userInfo, firstName: text})} placeholder="First Name" />
              <Input value={userInfo.lastName} onChangeText={(text) => setUserInfo({...userInfo, lastName: text})} placeholder="Last Name" />
              <Input value={userInfo.address} onChangeText={(text) => setUserInfo({...userInfo, address: text})} placeholder="Address" />
              <Input value={userInfo.city} onChangeText={(text) => setUserInfo({...userInfo, city: text})} placeholder="City" />
              <Button title="Save Changes" onPress={handleSave} buttonStyle={styles.saveButton} />
            </>
          ) : (
            <>
              <Text style={styles.infoText}>First Name: {userInfo.firstName}</Text>
              <Text style={styles.infoText}>Last Name: {userInfo.lastName}</Text>
              <Text style={styles.infoText}>Address: {userInfo.address}</Text>
              <Text style={styles.infoText}>City: {userInfo.city}</Text>
              <TouchableOpacity onPress={() => setEditing(true)} style={styles.editButton}>
                <Text style={styles.editButtonText}>Edit</Text>
              </TouchableOpacity>
            </>
          )}
        </Card>
        <Button title="Logout" onPress={handleLogout} buttonStyle={styles.logoutButton} />
      </ScrollView>
      <StatusBar style="auto" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  scrollView: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 20
  },
  card: {
    width: '90%',
    padding: 20,
    backgroundColor: '#ffffff',
    borderRadius: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  infoText: {
    marginVertical: 10,
    fontSize: 16,
    color: '#333',
  },
  editButton: {
    backgroundColor: '#007bff',
    padding: 10,
    marginTop: 10,
    borderRadius: 5,
  },
  editButtonText: {
    color: '#ffffff',
    textAlign: 'center',
    fontSize: 16,
  },
  saveButton: {
    backgroundColor: '#28a745',
    marginTop: 10,
  },
  logoutButton: {
    backgroundColor: '#dc3545',
    marginTop: 20,
  }
});
