import React, { useState, useEffect, useRef } from 'react';
import { MessageCircle, Send, X, Phone, Video, MoreVertical, Smile } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Avatar, AvatarFallback } from './ui/avatar';
import { ScrollArea } from './ui/scroll-area';
import { Badge } from './ui/badge';

interface Message {
  id: string;
  sender: 'user' | 'other';
  senderName: string;
  message: string;
  time: string;
  type: 'text' | 'image' | 'location';
}

interface ChatSimulatorProps {
  isOpen: boolean;
  onClose: () => void;
  chatType: 'group' | 'individual';
  chatTitle: string;
  userRole: 'admin' | 'advisor' | 'guide' | 'client';
  participants?: string[];
}

export function ChatSimulator({ 
  isOpen, 
  onClose, 
  chatType, 
  chatTitle, 
  userRole,
  participants = []
}: ChatSimulatorProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Mock messages based on chat type and user role
  useEffect(() => {
    if (isOpen) {
      const generateMessages = () => {
        if (chatType === 'group') {
          return [
            {
              id: '1',
              sender: 'other' as const,
              senderName: 'Carlos Ruiz (Guía)',
              message: '¡Buenos días grupo! Nos encontramos en el punto de partida a las 7:00 AM. El clima está perfecto para nuestra caminata.',
              time: '07:00',
              type: 'text' as const
            },
            {
              id: '2',
              sender: 'other' as const,
              senderName: 'María López',
              message: '¡Excelente! Ya estoy en camino. ¿Debo llevar algo adicional?',
              time: '07:05',
              type: 'text' as const
            },
            {
              id: '3',
              sender: 'other' as const,
              senderName: 'Carlos Ruiz (Guía)',
              message: 'Solo agua extra y protector solar. El resto del equipo lo proporcionamos nosotros.',
              time: '07:07',
              type: 'text' as const
            },
            {
              id: '4',
              sender: 'user' as const,
              senderName: userRole === 'client' ? 'Tú' : 'Yo',
              message: 'Perfecto, nos vemos en 10 minutos!',
              time: '07:08',
              type: 'text' as const
            }
          ];
        } else {
          // Individual chat messages based on role
          if (userRole === 'advisor') {
            return [
              {
                id: '1',
                sender: 'other' as const,
                senderName: 'Ana García',
                message: 'Hola, estoy interesada en el tour a la Sierra Nevada para la próxima semana.',
                time: '14:30',
                type: 'text' as const
              },
              {
                id: '2',
                sender: 'user' as const,
                senderName: 'Yo',
                message: '¡Hola Ana! Claro, tenemos disponibilidad para el miércoles y viernes. ¿Cuál te conviene más?',
                time: '14:32',
                type: 'text' as const
              },
              {
                id: '3',
                sender: 'other' as const,
                senderName: 'Ana García',
                message: 'El viernes estaría perfecto. ¿Qué incluye el paquete?',
                time: '14:35',
                type: 'text' as const
              }
            ];
          } else if (userRole === 'guide') {
            return [
              {
                id: '1',
                sender: 'other' as const,
                senderName: 'Pedro Hernández',
                message: 'Carlos, tengo una duda sobre el punto de encuentro para mañana.',
                time: '16:45',
                type: 'text' as const
              },
              {
                id: '2',
                sender: 'user' as const,
                senderName: 'Yo',
                message: 'Hola Pedro, el punto de encuentro es en la entrada principal del parque a las 7:00 AM.',
                time: '16:47',
                type: 'text' as const
              }
            ];
          }
        }
        return [];
      };

      setMessages(generateMessages());
    }
  }, [isOpen, chatType, userRole]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = () => {
    if (newMessage.trim()) {
      const message: Message = {
        id: Date.now().toString(),
        sender: 'user',
        senderName: userRole === 'client' ? 'Tú' : 'Yo',
        message: newMessage,
        time: new Date().toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' }),
        type: 'text'
      };

      setMessages(prev => [...prev, message]);
      setNewMessage('');

      // Simulate typing indicator and response
      setIsTyping(true);
      setTimeout(() => {
        setIsTyping(false);
        
        // Generate auto-response
        const responses = [
          'Perfecto, gracias por la información.',
          'Entendido, estaremos atentos.',
          '¡Que buena noticia!',
          'Okay, nos vemos entonces.',
          'Muchas gracias por confirmar.'
        ];
        
        const autoResponse: Message = {
          id: (Date.now() + 1).toString(),
          sender: 'other',
          senderName: chatType === 'group' ? 'Participante' : 'Contacto',
          message: responses[Math.floor(Math.random() * responses.length)],
          time: new Date().toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' }),
          type: 'text'
        };
        
        setMessages(prev => [...prev, autoResponse]);
      }, 2000);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md h-[600px] bg-white shadow-xl border-2 flex flex-col">
        {/* Chat Header */}
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4 border-b">
          <div className="flex items-center space-x-3">
            <Avatar className="w-10 h-10">
              <AvatarFallback className="bg-green-100 text-green-700">
                {chatType === 'group' ? '👥' : chatTitle.charAt(0)}
              </AvatarFallback>
            </Avatar>
            <div>
              <CardTitle className="text-base">{chatTitle}</CardTitle>
              <p className="text-xs text-muted-foreground">
                {chatType === 'group' 
                  ? `${participants.length || 8} participantes` 
                  : 'En línea'
                }
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <Button variant="ghost" size="sm" className="p-2">
              <Phone className="w-4 h-4 text-green-600" />
            </Button>
            <Button variant="ghost" size="sm" className="p-2">
              <Video className="w-4 h-4 text-green-600" />
            </Button>
            <Button variant="ghost" size="sm" className="p-2">
              <MoreVertical className="w-4 h-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="hover:bg-red-100 p-2"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        </CardHeader>

        {/* Messages Area */}
        <CardContent className="flex-1 p-0 overflow-hidden">
          <ScrollArea className="h-full p-4">
            <div className="space-y-4">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div className={`max-w-[80%] ${message.sender === 'user' ? 'order-2' : 'order-1'}`}>
                    {message.sender === 'other' && chatType === 'group' && (
                      <p className="text-xs text-muted-foreground mb-1 px-3">
                        {message.senderName}
                      </p>
                    )}
                    <div
                      className={`p-3 rounded-lg ${
                        message.sender === 'user'
                          ? 'bg-green-600 text-white rounded-br-sm'
                          : 'bg-gray-100 text-gray-900 rounded-bl-sm'
                      }`}
                    >
                      <p className="text-sm">{message.message}</p>
                      <p className={`text-xs mt-1 ${
                        message.sender === 'user' ? 'text-green-100' : 'text-gray-500'
                      }`}>
                        {message.time}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
              
              {isTyping && (
                <div className="flex justify-start">
                  <div className="bg-gray-100 p-3 rounded-lg rounded-bl-sm">
                    <div className="flex space-x-1">
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                    </div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
          </ScrollArea>
        </CardContent>

        {/* Message Input */}
        <div className="p-4 border-t">
          <div className="flex items-center space-x-2">
            <Button variant="ghost" size="sm" className="p-2">
              <Smile className="w-4 h-4 text-gray-500" />
            </Button>
            <Input
              placeholder="Escribe un mensaje..."
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              className="flex-1"
            />
            <Button 
              onClick={handleSendMessage}
              disabled={!newMessage.trim()}
              className="bg-green-600 hover:bg-green-700 p-2"
            >
              <Send className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}