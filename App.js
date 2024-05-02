import React, { useEffect, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from './firebase-config'; // Update this path
import Home from './components/Home';
import Settings from './components/Settings';
import Staff from './components/Staff';
import Locations from './components/Locations';
import Booking from './components/Booking';
import Login from './components/Authentication/Login';
import Signup from './components/Authentication/Signup'
import Ionicons from 'react-native-vector-icons/Ionicons';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

const App = () => {
  const [user, setUser] = useState(null);

  // Haetaan kirjautunut käyttäjä onAuthStateChanged-funktiolla (kuuntelee Firebase-autentikaation tilan muutoksia)
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, currentUser => {
      setUser(currentUser);
    });
    return () => unsubscribe(); // Kuuntelu suljetaan
  }, []);


// Navigointi-menu. Hieman muuttettu aiemmin tehdyistä kotiläksyistä.
  return (
    <NavigationContainer>
      {user ? (
        <Tab.Navigator
          screenOptions={({ route }) => ({
            tabBarIcon: ({ focused, color, size }) => {
              let iconName;
              switch (route.name) {
                case 'Home':
                  iconName = focused ? 'home' : 'home-outline';
                  break;
                case 'Settings':
                  iconName = focused ? 'settings' : 'settings-outline';
                  break;
                case 'Staff':
                  iconName = focused ? 'reader' : 'reader-outline';
                  break;
                case 'Locations':
                  iconName = focused ? 'location' : 'location-outline';
                  break;
                case 'Booking':
                  iconName = focused ? 'add-circle' : 'add-circle-outline';
                  break;
                default:
                  break;
              }
              return <Ionicons name={iconName} size={size + 5} color={color} />;
            },
          })}
        >
          <Tab.Screen name="Home" component={Home} />
          <Tab.Screen name="Staff" component={Staff} />
          <Tab.Screen name="Booking" component={Booking} />
          <Tab.Screen name="Locations" component={Locations} />
          <Tab.Screen name="Settings" component={Settings} />
        </Tab.Navigator>
      ) : (
        <Stack.Navigator>
          <Stack.Screen name="Login" component={Login} options={{ headerShown: false }} />
          <Stack.Screen name="Signup" component={Signup} />
        </Stack.Navigator>
      )}
    </NavigationContainer>
  );
};

export default App;
