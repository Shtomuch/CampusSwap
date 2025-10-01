import React, { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Tab } from '@headlessui/react';
import { CalendarIcon, MapPinIcon, ClockIcon, CheckCircleIcon, XCircleIcon, TrashIcon } from '@heroicons/react/24/outline';
import api from '../services/api';
import { Order, OrderStatus } from '../types';
import { format } from 'date-fns';
import { uk } from 'date-fns/locale';
import { ConfirmModal, PromptModal } from '../components/Modal';
import { useToast, ToastContainer } from '../components/Toast';

function classNames(...classes: string[]) {
  return classes.filter(Boolean).join(' ');
}

const statusColors: Record<OrderStatus, string> = {
  [OrderStatus.Pending]: 'bg-yellow-100 text-yellow-800',
  [OrderStatus.Confirmed]: 'bg-blue-100 text-blue-800',
  [OrderStatus.InProgress]: 'bg-indigo-100 text-indigo-800',
  [OrderStatus.Completed]: 'bg-green-100 text-green-800',
  [OrderStatus.Cancelled]: 'bg-red-100 text-red-800',
  [OrderStatus.Refunded]: 'bg-gray-100 text-gray-800',
};

const statusLabels: Record<OrderStatus, string> = {
  [OrderStatus.Pending]: 'Очікує підтвердження',
  [OrderStatus.Confirmed]: 'Підтверджено',
  [OrderStatus.InProgress]: 'В процесі',
  [OrderStatus.Completed]: 'Завершено',
  [OrderStatus.Cancelled]: 'Скасовано',
  [OrderStatus.Refunded]: 'Повернення',
};

export default function OrdersPage() {
  const queryClient = useQueryClient();
  const { toasts, removeToast, showSuccess, showError } = useToast();
  
  // Modal states
  const [deleteModal, setDeleteModal] = useState<{ isOpen: boolean; orderId: string | null }>({
    isOpen: false,
    orderId: null
  });
  
  const [cancelModal, setCancelModal] = useState<{ isOpen: boolean; orderId: string | null }>({
    isOpen: false,
    orderId: null
  });
  const { data: buyerOrders = [], isLoading: buyerLoading } = useQuery<Order[]>({
    queryKey: ['orders', 'buyer'],
    queryFn: async () => {
      const response = await api.get('/orders', { params: { isBuyer: true } });
      return response.data;
    },
  });

  const { data: sellerOrders = [], isLoading: sellerLoading } = useQuery<Order[]>({
    queryKey: ['orders', 'seller'],
    queryFn: async () => {
      const response = await api.get('/orders', { params: { isBuyer: false } });
      return response.data;
    },
  });

  const handleConfirmOrder = async (orderId: string) => {
    try {
      await api.put(`/orders/${orderId}/confirm`);
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['orders', 'buyer'] }),
        queryClient.invalidateQueries({ queryKey: ['orders', 'seller'] }),
      ]);
      showSuccess('Замовлення підтверджено', 'Замовлення успішно підтверджено');
    } catch (error: any) {
      console.error('Error confirming order:', error);
      const errorMessage = error?.response?.data?.message || error?.message || 'Не вдалося підтвердити замовлення';
      showError('Помилка підтвердження', errorMessage);
    }
  };

  const handleCompleteOrder = async (orderId: string) => {
    try {
      await api.put(`/orders/${orderId}/complete`);
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['orders', 'buyer'] }),
        queryClient.invalidateQueries({ queryKey: ['orders', 'seller'] }),
      ]);
      showSuccess('Угода завершена', 'Замовлення успішно завершено');
    } catch (error: any) {
      console.error('Error completing order:', error);
      const errorMessage = error?.response?.data?.message || error?.message || 'Не вдалося завершити замовлення';
      showError('Помилка завершення', errorMessage);
    }
  };

  const handleCancelOrder = async (orderId: string, reason: string) => {
    try {
      await api.put(`/orders/${orderId}/cancel`, { reason });
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['orders', 'buyer'] }),
        queryClient.invalidateQueries({ queryKey: ['orders', 'seller'] }),
      ]);
      showSuccess('Замовлення скасовано', 'Замовлення успішно скасовано');
    } catch (error: any) {
      console.error('Error cancelling order:', error);
      const errorMessage = error?.response?.data?.message || error?.message || 'Не вдалося скасувати замовлення';
      showError('Помилка скасування', errorMessage);
    }
  };

  const handleDeleteOrder = async (orderId: string) => {
    try {
      await api.delete(`/orders/${orderId}`);
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['orders', 'buyer'] }),
        queryClient.invalidateQueries({ queryKey: ['orders', 'seller'] }),
      ]);
      showSuccess('Замовлення видалено', 'Замовлення успішно видалено з системи');
    } catch (error: any) {
      console.error('Error deleting order:', error);
      const errorMessage = error?.response?.data?.message || error?.message || 'Не вдалося видалити замовлення';
      showError('Помилка видалення', errorMessage);
    }
  };

  const openDeleteModal = (orderId: string) => {
    setDeleteModal({ isOpen: true, orderId });
  };

  const closeDeleteModal = () => {
    setDeleteModal({ isOpen: false, orderId: null });
  };

  const openCancelModal = (orderId: string) => {
    setCancelModal({ isOpen: true, orderId });
  };

  const closeCancelModal = () => {
    setCancelModal({ isOpen: false, orderId: null });
  };

  const OrderCard = ({ order, isSeller }: { order: Order; isSeller: boolean }) => (
    <div className="bg-white rounded-lg shadow p-6 mb-4">
      <div className="flex justify-between items-start mb-4">
        <div>
          <p className="text-sm text-gray-500">Замовлення #{order.orderNumber}</p>
          <h3 className="text-lg font-semibold text-gray-900">{order.listingTitle}</h3>
        </div>
        <span className={`px-3 py-1 rounded-full text-sm font-medium ${statusColors[order.status]}`}>
          {statusLabels[order.status]}
        </span>
      </div>

      <div className="space-y-2 text-sm text-gray-600 mb-4">
        <div className="flex items-center">
          <CalendarIcon className="h-4 w-4 mr-2" />
          <span>Створено: {format(new Date(order.createdAt), 'dd MMMM yyyy, HH:mm', { locale: uk })}</span>
        </div>
        <div className="flex items-center">
          <MapPinIcon className="h-4 w-4 mr-2" />
          <span>Місце зустрічі: {order.meetingLocation}</span>
        </div>
        <div className="flex items-center">
          <ClockIcon className="h-4 w-4 mr-2" />
          <span>Час зустрічі: {format(new Date(order.meetingTime), 'dd MMMM yyyy, HH:mm', { locale: uk })}</span>
        </div>
      </div>

      <div className="flex justify-between items-center mb-4">
        <div>
          <p className="text-sm text-gray-500">
            {isSeller ? 'Покупець' : 'Продавець'}:
            <span className="font-medium text-gray-900 ml-1">
              {isSeller ? order.buyerName : order.sellerName}
            </span>
          </p>
        </div>
        <p className="text-xl font-bold text-primary-600">
          {order.totalAmount ? order.totalAmount.toLocaleString('uk-UA') : '0'} {order.currency || '₴'}
        </p>
      </div>

      {order.notes && (
        <div className="mb-4 p-3 bg-gray-50 rounded">
          <p className="text-sm text-gray-600">{order.notes}</p>
        </div>
      )}

      <div className="flex gap-2">
        {isSeller && order.status === OrderStatus.Pending && (
          <>
            <button
              onClick={() => handleConfirmOrder(order.id)}
              className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center justify-center"
            >
              <CheckCircleIcon className="h-5 w-5 mr-2" />
              Підтвердити
            </button>
            <button
              onClick={() => handleCancelOrder(order.id, 'Товар недоступний')}
              className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 flex items-center justify-center"
            >
              <XCircleIcon className="h-5 w-5 mr-2" />
              Відхилити
            </button>
          </>
        )}

        {/* Кнопка скасування для покупця */}
        {!isSeller && order.status === OrderStatus.Pending && (
          <button
            onClick={() => openCancelModal(order.id)}
            className="flex-1 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 flex items-center justify-center"
          >
            <XCircleIcon className="h-5 w-5 mr-2" />
            Скасувати замовлення
          </button>
        )}

        {order.status === OrderStatus.Confirmed && (
          <button
            onClick={() => handleCompleteOrder(order.id)}
            className="flex-1 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
          >
            Завершити угоду
          </button>
        )}

        {order.status === OrderStatus.Completed && (
          <button className="flex-1 px-4 py-2 border border-primary-600 text-primary-600 rounded-lg hover:bg-primary-50">
            Залишити відгук
          </button>
        )}

        {/* Кнопка видалення - доступна тільки для Pending або Cancelled замовлень */}
        {(order.status === OrderStatus.Pending || order.status === OrderStatus.Cancelled) && (
          <button
            onClick={() => openDeleteModal(order.id)}
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 flex items-center justify-center"
            title="Видалити замовлення"
          >
            <TrashIcon className="h-5 w-5" />
          </button>
        )}
      </div>
    </div>
  );

  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Мої замовлення</h1>

      <Tab.Group>
        <Tab.List className="flex space-x-1 rounded-xl bg-blue-900/20 p-1 mb-6">
          <Tab
            className={({ selected }) =>
              classNames(
                'w-full rounded-lg py-2.5 text-sm font-medium leading-5',
                'ring-white ring-opacity-60 ring-offset-2 ring-offset-blue-400 focus:outline-none focus:ring-2',
                selected
                  ? 'bg-white text-blue-700 shadow'
                  : 'text-blue-700 hover:bg-white/[0.12] hover:text-blue-800'
              )
            }
          >
            Покупки ({buyerOrders.length})
          </Tab>
          <Tab
            className={({ selected }) =>
              classNames(
                'w-full rounded-lg py-2.5 text-sm font-medium leading-5',
                'ring-white ring-opacity-60 ring-offset-2 ring-offset-blue-400 focus:outline-none focus:ring-2',
                selected
                  ? 'bg-white text-blue-700 shadow'
                  : 'text-blue-700 hover:bg-white/[0.12] hover:text-blue-800'
              )
            }
          >
            Продажі ({sellerOrders.length})
          </Tab>
        </Tab.List>

        <Tab.Panels>
          <Tab.Panel>
            {buyerLoading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
              </div>
            ) : buyerOrders.length > 0 ? (
              buyerOrders.map(order => (
                <OrderCard key={order.id} order={order} isSeller={false} />
              ))
            ) : (
              <div className="text-center py-12 text-gray-500">
                У вас поки немає покупок
              </div>
            )}
          </Tab.Panel>

          <Tab.Panel>
            {sellerLoading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
              </div>
            ) : sellerOrders.length > 0 ? (
              sellerOrders.map(order => (
                <OrderCard key={order.id} order={order} isSeller={true} />
              ))
            ) : (
              <div className="text-center py-12 text-gray-500">
                У вас поки немає продажів
              </div>
            )}
          </Tab.Panel>
        </Tab.Panels>
      </Tab.Group>

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={deleteModal.isOpen}
        onClose={closeDeleteModal}
        onConfirm={() => deleteModal.orderId && handleDeleteOrder(deleteModal.orderId)}
        title="Видалити замовлення"
        message="Ви впевнені, що хочете видалити це замовлення? Ця дія незворотна і замовлення буде повністю видалено з системи."
        confirmText="Видалити"
        cancelText="Скасувати"
        variant="danger"
      />

      {/* Cancel Order Modal */}
      <PromptModal
        isOpen={cancelModal.isOpen}
        onClose={closeCancelModal}
        onSubmit={(reason) => cancelModal.orderId && handleCancelOrder(cancelModal.orderId, reason)}
        title="Скасувати замовлення"
        message="Введіть причину скасування замовлення:"
        placeholder="Наприклад: Змінив думку, товар більше не потрібен..."
        submitText="Скасувати замовлення"
        cancelText="Залишити замовлення"
        required={true}
      />

      {/* Toast notifications */}
      <ToastContainer toasts={toasts} onClose={removeToast} />
    </div>
  );
}