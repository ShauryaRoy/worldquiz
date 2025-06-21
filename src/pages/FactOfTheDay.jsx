
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/components/ui/use-toast';
import QuizLayout from '@/components/QuizLayout';
import { countryFacts } from '@/data/countries';
import { RefreshCw, Mail, Home } from 'lucide-react';
import { Link } from 'react-router-dom';

const FactOfTheDay = () => {
  const [currentFact, setCurrentFact] = useState(null);
  const [email, setEmail] = useState('');
  const [subscribed, setSubscribed] = useState(false);
  const { toast } = useToast();

  const getRandomFact = () => {
    const randomIndex = Math.floor(Math.random() * countryFacts.length);
    setCurrentFact(countryFacts[randomIndex]);
  };

  useEffect(() => {
    getRandomFact();
  }, []);

  const handleSubscribe = () => {
    if (!email.trim()) {
      toast({
        title: "Email required",
        description: "Please enter your email address",
        variant: "destructive"
      });
      return;
    }

    if (!email.includes('@')) {
      toast({
        title: "Invalid email",
        description: "Please enter a valid email address",
        variant: "destructive"
      });
      return;
    }

    setSubscribed(true);
    toast({
      title: "🚧 This feature isn't implemented yet—but don't worry! You can request it in your next prompt! 🚀",
      description: `We'll send daily facts to ${email}`,
    });
  };

  if (!currentFact) {
    return (
      <QuizLayout title="Country Facts" description="Loading amazing facts...">
        <div className="flex justify-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-white"></div>
        </div>
      </QuizLayout>
    );
  }

  return (
    <QuizLayout 
      title="Country Fact of the Day" 
      description="Discover amazing facts about countries around the world"
    >
      <div className="max-w-4xl mx-auto">
        {/* Main Fact Card */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="mb-8"
        >
          <Card className="bg-gradient-to-br from-cyan-500/20 to-blue-600/20 border-white/20 overflow-hidden">
            <CardHeader className="text-center pb-4">
              <motion.img 
                src={currentFact.flag} 
                alt={`Flag of ${currentFact.country}`}
                className="w-32 h-20 object-cover rounded-lg mx-auto mb-4 shadow-lg"
                whileHover={{ scale: 1.05 }}
              />
              <CardTitle className="text-3xl font-bold text-white">
                {currentFact.country}
              </CardTitle>
            </CardHeader>
            <CardContent className="text-center">
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.2 }}
                className="bg-white/10 rounded-xl p-6 mb-6"
              >
                <div className="text-4xl mb-4">💡</div>
                <p className="text-lg text-white leading-relaxed">
                  {currentFact.fact}
                </p>
              </motion.div>
              
              <Button 
                onClick={getRandomFact}
                className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Get New Fact
              </Button>
            </CardContent>
          </Card>
        </motion.div>

        {/* Newsletter Subscription */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="mb-8"
        >
          <Card className="bg-gradient-to-r from-purple-500/20 to-pink-600/20 border-white/20">
            <CardHeader>
              <CardTitle className="text-white text-center flex items-center justify-center gap-2">
                <Mail className="w-5 h-5" />
                Daily Geography Facts
              </CardTitle>
            </CardHeader>
            <CardContent>
              {!subscribed ? (
                <div className="max-w-md mx-auto">
                  <p className="text-white/80 text-center mb-4">
                    Get amazing geography facts delivered to your inbox every day!
                  </p>
                  <div className="flex gap-2">
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="Enter your email..."
                      className="flex-1 px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-purple-500"
                    />
                    <Button onClick={handleSubscribe}>
                      Subscribe
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="text-center">
                  <div className="text-4xl mb-2">✅</div>
                  <p className="text-white">
                    Thanks for subscribing! You'll receive daily facts at {email}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Fun Stats */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8"
        >
          <Card className="bg-white/5 border-white/20 text-center">
            <CardContent className="p-6">
              <div className="text-3xl font-bold text-blue-400 mb-2">195</div>
              <div className="text-white/80">Countries in the World</div>
            </CardContent>
          </Card>
          
          <Card className="bg-white/5 border-white/20 text-center">
            <CardContent className="p-6">
              <div className="text-3xl font-bold text-green-400 mb-2">7</div>
              <div className="text-white/80">Continents</div>
            </CardContent>
          </Card>
          
          <Card className="bg-white/5 border-white/20 text-center">
            <CardContent className="p-6">
              <div className="text-3xl font-bold text-purple-400 mb-2">24</div>
              <div className="text-white/80">Time Zones</div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Navigation */}
        <div className="text-center">
          <Link to="/">
            <Button variant="outline" className="border-white/20 text-white hover:bg-white/10">
              <Home className="w-4 h-4 mr-2" />
              Back to Quizzes
            </Button>
          </Link>
        </div>
      </div>
    </QuizLayout>
  );
};

export default FactOfTheDay;
