'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  MessageCircle, 
  Plus, 
  Clock,
  AlertCircle,
  CheckCircle,
  Eye,
  X,
  Paperclip,
  Send,
  Book,
  Mail,
  Phone,
  MessageSquare
} from 'lucide-react';

interface SupportTicket {
  id: string;
  subject: string;
  description: string;
  category: string;
  priority: string;
  status: string;
  created_at: string;
  updated_at: string;
  last_response_at: string;
  response_count: number;
}

interface TicketsData {
  tickets: SupportTicket[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    total_pages: number;
  };
}

const categoryOptions = [
  { value: 'technical', label: 'Technical Issue', icon: '🔧' },
  { value: 'billing', label: 'Billing & Payments', icon: '💳' },
  { value: 'account', label: 'Account & Profile', icon: '👤' },
  { value: 'content', label: 'Content & Moderation', icon: '🛡️' },
  { value: 'other', label: 'Other', icon: '❓' },
];

const priorityOptions = [
  { value: 'low', label: 'Low', color: 'text-gray-600 bg-gray-100' },
  { value: 'medium', label: 'Medium', color: 'text-blue-600 bg-blue-100' },
  { value: 'high', label: 'High', color: 'text-yellow-600 bg-yellow-100' },
  { value: 'urgent', label: 'Urgent', color: 'text-red-600 bg-red-100' },
];

export default function SupportPage() {
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  
  // Form state
  const [formData, setFormData] = useState({
    subject: '',
    description: '',
    category: 'technical',
    priority: 'medium',
  });

  useEffect(() => {
    fetchTickets();
  }, []);

  const fetchTickets = async () => {
    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/support/tickets');
      
      if (!response.ok) {
        if (response.status === 401) {
          // User not logged in, show login prompt
          setError('Please sign in to view your support tickets');
          return;
        }
        throw new Error('Failed to fetch tickets');
      }

      const data: TicketsData = await response.json();
      setTickets(data.tickets);
    } catch (err) {
      setError('Failed to load support tickets');
      console.error('Support tickets error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const response = await fetch('/api/support/tickets', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('Please sign in to create a support ticket');
        }
        throw new Error('Failed to create ticket');
      }

      const result = await response.json();
      
      // Reset form and refresh tickets
      setFormData({
        subject: '',
        description: '',
        category: 'technical',
        priority: 'medium',
      });
      setShowCreateForm(false);
      fetchTickets();
      
      // Show success message
      alert('Support ticket created successfully! We\'ll get back to you within 24 hours.');

    } catch (err: any) {
      alert(err.message || 'Failed to create support ticket');
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'open':
      case 'waiting_for_admin':
        return <Clock className="h-4 w-4 text-blue-500" />;
      case 'in_progress':
        return <AlertCircle className="h-4 w-4 text-yellow-500" />;
      case 'resolved':
      case 'closed':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      default:
        return <AlertCircle className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'open':
      case 'waiting_for_admin':
        return 'text-blue-600 bg-blue-100';
      case 'in_progress':
        return 'text-yellow-600 bg-yellow-100';
      case 'resolved':
      case 'closed':
        return 'text-green-600 bg-green-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const TicketCard = ({ ticket }: { ticket: SupportTicket }) => (
    <Link
      href={`/support/${ticket.id}`}
      className="block bg-white rounded-lg shadow-lg hover:shadow-xl transition-shadow p-6"
    >
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center space-x-3">
          {getStatusIcon(ticket.status)}
          <div>
            <h3 className="font-semibold text-gray-900 line-clamp-1">
              {ticket.subject}
            </h3>
            <p className="text-sm text-gray-600">
              Ticket #{ticket.id.split('-')[0]}
            </p>
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          <span className={`inline-block px-2 py-1 text-xs font-medium rounded-full ${
            priorityOptions.find(p => p.value === ticket.priority)?.color || 'text-gray-600 bg-gray-100'
          }`}>
            {priorityOptions.find(p => p.value === ticket.priority)?.label || ticket.priority}
          </span>
          <span className={`inline-block px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(ticket.status)}`}>
            {ticket.status.replace('_', ' ')}
          </span>
        </div>
      </div>
      
      <p className="text-gray-600 text-sm mb-4 line-clamp-2">
        {ticket.description}
      </p>
      
      <div className="flex items-center justify-between text-sm text-gray-500">
        <div className="flex items-center space-x-4">
          <span className="capitalize">
            {categoryOptions.find(c => c.value === ticket.category)?.icon} {ticket.category}
          </span>
          <span>
            {ticket.response_count} responses
          </span>
        </div>
        <span>
          {formatDate(ticket.created_at)}
        </span>
      </div>
    </Link>
  );

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Support Center</h1>
            <p className="text-gray-600 mt-2">
              Get help with your account, report issues, or ask questions
            </p>
          </div>
          
          <button
            onClick={() => setShowCreateForm(!showCreateForm)}
            className="bg-indigo-600 text-white px-6 py-3 rounded-lg hover:bg-indigo-700 transition flex items-center"
          >
            {showCreateForm ? <X className="h-5 w-5 mr-2" /> : <Plus className="h-5 w-5 mr-2" />}
            {showCreateForm ? 'Cancel' : 'New Ticket'}
          </button>
        </div>

        {/* Quick Help Links */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Link
            href="/help"
            className="bg-white rounded-lg shadow-lg p-6 hover:shadow-xl transition-shadow"
          >
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <Book className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">Help Center</h3>
                <p className="text-sm text-gray-600">Browse articles and guides</p>
              </div>
            </div>
          </Link>
          
          <div className="bg-white rounded-lg shadow-lg p-6">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <Mail className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">Email Support</h3>
                <p className="text-sm text-gray-600">support@verdict.com</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow-lg p-6">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                <MessageSquare className="h-6 w-6 text-purple-600" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">Live Chat</h3>
                <p className="text-sm text-gray-600">Available 9am-5pm EST</p>
              </div>
            </div>
          </div>
        </div>

        {/* Create Ticket Form */}
        {showCreateForm && (
          <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">Create New Support Ticket</h2>
            
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label htmlFor="subject" className="block text-sm font-medium text-gray-700 mb-2">
                  Subject *
                </label>
                <input
                  type="text"
                  id="subject"
                  required
                  value={formData.subject}
                  onChange={(e) => setFormData(prev => ({ ...prev, subject: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  placeholder="Brief description of your issue"
                />
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-2">
                    Category *
                  </label>
                  <select
                    id="category"
                    required
                    value={formData.category}
                    onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  >
                    {categoryOptions.map(option => (
                      <option key={option.value} value={option.value}>
                        {option.icon} {option.label}
                      </option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label htmlFor="priority" className="block text-sm font-medium text-gray-700 mb-2">
                    Priority
                  </label>
                  <select
                    id="priority"
                    value={formData.priority}
                    onChange={(e) => setFormData(prev => ({ ...prev, priority: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  >
                    {priorityOptions.map(option => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              
              <div>
                <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
                  Description *
                </label>
                <textarea
                  id="description"
                  required
                  rows={6}
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  placeholder="Please provide detailed information about your issue..."
                />
              </div>
              
              <div className="flex items-center justify-between">
                <p className="text-sm text-gray-600">
                  We typically respond within 24 hours
                </p>
                
                <div className="flex items-center space-x-3">
                  <button
                    type="button"
                    onClick={() => setShowCreateForm(false)}
                    className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="bg-indigo-600 text-white px-6 py-2 rounded-lg hover:bg-indigo-700 transition disabled:opacity-50 flex items-center"
                  >
                    {submitting ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Creating...
                      </>
                    ) : (
                      <>
                        <Send className="h-4 w-4 mr-2" />
                        Create Ticket
                      </>
                    )}
                  </button>
                </div>
              </div>
            </form>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-8">
            <div className="flex items-center">
              <AlertCircle className="h-5 w-5 text-red-500 mr-2" />
              <p className="text-red-600">{error}</p>
            </div>
            {error.includes('sign in') && (
              <div className="mt-4">
                <Link
                  href="/auth/login"
                  className="inline-block bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition"
                >
                  Sign In
                </Link>
              </div>
            )}
          </div>
        )}

        {/* Tickets List */}
        <div>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-gray-900">Your Support Tickets</h2>
            {tickets.length > 0 && (
              <p className="text-sm text-gray-600">
                {tickets.length} ticket{tickets.length !== 1 ? 's' : ''}
              </p>
            )}
          </div>

          {loading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto mb-4"></div>
              <p className="text-gray-500">Loading your tickets...</p>
            </div>
          ) : tickets.length > 0 ? (
            <div className="space-y-4">
              {tickets.map((ticket) => (
                <TicketCard key={ticket.id} ticket={ticket} />
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <MessageCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No support tickets yet</h3>
              <p className="text-gray-500 mb-6">
                When you create a support ticket, it will appear here
              </p>
              <button
                onClick={() => setShowCreateForm(true)}
                className="bg-indigo-600 text-white px-6 py-3 rounded-lg hover:bg-indigo-700 transition"
              >
                Create Your First Ticket
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}