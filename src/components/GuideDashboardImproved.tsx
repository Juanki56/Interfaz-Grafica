import React from 'react';
import { useAuth } from '../App';
import { motion } from 'motion/react';
import { Award, User, Calendar, Bell } from 'lucide-react';
import { Card, CardContent } from './ui/card';
import { DashboardLayout, DashboardSection } from './DashboardLayout';

export function GuideDashboardImproved() {
  const { user, setCurrentView } = useAuth();

  return (
    <DashboardLayout>
      <DashboardSection>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col items-center justify-center min-h-[60vh] space-y-8"
        >
          <div className="text-center space-y-4">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-emerald-500 to-green-600 rounded-full mb-4">
              <Award className="w-10 h-10 text-white" />
            </div>
            <h2 className="bg-gradient-to-r from-emerald-700 to-green-600 bg-clip-text text-transparent">
              Bienvenido, {user?.name}
            </h2>
            <p className="text-gray-600 max-w-md mx-auto">
              Utiliza el menú lateral para acceder a las diferentes secciones de tu panel de guía
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full max-w-3xl">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
              <Card 
                className="border-emerald-200 hover:shadow-lg transition-all cursor-pointer"
                onClick={() => setCurrentView('profile')}
              >
                <CardContent className="p-6 text-center">
                  <User className="w-8 h-8 text-emerald-600 mx-auto mb-3" />
                  <h3 className="text-emerald-800 mb-2">Mi Perfil</h3>
                  <p className="text-sm text-gray-600">
                    Ver y editar información personal
                  </p>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <Card 
                className="border-emerald-200 hover:shadow-lg transition-all cursor-pointer"
                onClick={() => setCurrentView('programming')}
              >
                <CardContent className="p-6 text-center">
                  <Calendar className="w-8 h-8 text-emerald-600 mx-auto mb-3" />
                  <h3 className="text-emerald-800 mb-2">Programación</h3>
                  <p className="text-sm text-gray-600">
                    Gestionar horarios y tours
                  </p>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              <Card className="border-emerald-200 hover:shadow-lg transition-all cursor-pointer">
                <CardContent className="p-6 text-center">
                  <Bell className="w-8 h-8 text-emerald-600 mx-auto mb-3" />
                  <h3 className="text-emerald-800 mb-2">Notificaciones</h3>
                  <p className="text-sm text-gray-600">
                    Ver alertas y mensajes
                  </p>
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </motion.div>
      </DashboardSection>
    </DashboardLayout>
  );
}
