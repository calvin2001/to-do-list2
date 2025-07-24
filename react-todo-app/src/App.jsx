import { useState, useEffect, useMemo, useCallback } from 'react';

// 🎯 커스텀 Hook - 로컬스토리지 관리
function useLocalStorage(key, initialValue) {
    // 초기값을 함수로 지연 계산
    const [storedValue, setStoredValue] = useState(() => {
        try {
            const item = window.localStorage.getItem(key);
            return item ? JSON.parse(item) : initialValue;
        } catch (error) {
            console.error(`로컬스토리지 읽기 실패 (${key}):`, error);
            return initialValue;
        }
    });

    // 값을 저장하는 함수
    const setValue = useCallback((value) => {
        try {
            setStoredValue(value);
            window.localStorage.setItem(key, JSON.stringify(value));
        } catch (error) {
            console.error(`로컬스토리지 저장 실패 (${key}):`, error);
        }
    }, [key]);

    return [storedValue, setValue];
}

// 🎯 커스텀 Hook - 온라인 상태 감지
function useOnlineStatus() {
    const [isOnline, setIsOnline] = useState(navigator.onLine);

    useEffect(() => {
        const handleOnline = () => setIsOnline(true);
        const handleOffline = () => setIsOnline(false);

        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);

        // 🎯 클린업 함수 (컴포넌트 언마운트 시 실행)
        return () => {
            window.removeEventListener('online', handleOnline);
            window.removeEventListener('offline', handleOffline);
        };
    }, []);

    return isOnline;
}

// 🎯 커스텀 Hook - 현재 시간
function useCurrentTime() {
    const [currentTime, setCurrentTime] = useState(new Date());

    useEffect(() => {
        const timer = setInterval(() => {
            setCurrentTime(new Date());
        }, 1000);

        // 클린업: 타이머 정리
        return () => {
            clearInterval(timer);
        }
    }, []);

    return currentTime;
}

function useDebounce(value, delay) {
    const [debouncedValue, setDebouncedValue] = useState(value);

    useEffect(() => {
        console.log(`⏰ 새 타이머 시작: ${value}`);
        const timer = setTimeout(() => {
            console.log(`✅ 실행됨: ${value}`);
            setDebouncedValue(value);
        }, delay);

        return () => {
            console.log(`❌ 타이머 취소: ${value}`);
            clearTimeout(timer);
        };
    }, [value, delay]);

    return debouncedValue;
}

// 🎯 메인 App 컴포넌트
function App() {
    // 🟢 커스텀 Hook 사용으로 코드 간소화
    const [todos, setTodos] = useLocalStorage('react-todos-v2', []);
    const [inputText, setInputText] = useState('');
    const [filter, setFilter] = useLocalStorage('todo-filter', 'all');
    const [priority, setPriority] = useState('low');
    const [searchTerm, setSearchTerm] = useState('');

    // ✅ 새로 추가: 디바운스된 검색어
    const debouncedSearchTerm = useDebounce(searchTerm, 300);
    
    // 🟢 온라인 상태와 현재 시간
    const isOnline = useOnlineStatus();
    const currentTime = useCurrentTime();

    // 🎯 성능 최적화: useMemo로 비싼 계산 캐싱
    const filteredAndSortedTodos = useMemo(() => {
        console.log('📊 할 일 목록 필터링 및 정렬 실행');
        
        let filtered = todos.filter(todo => {
            // 필터 조건
            if (filter === 'active' && todo.completed) return false;
            if (filter === 'completed' && !todo.completed) return false;
            
            // 검색 조건
            if (debouncedSearchTerm && !todo.text.toLowerCase().includes(debouncedSearchTerm.toLowerCase())) {
                return false;
            }
            
            return true;
        });

        // 우선순위별 정렬
        return filtered.sort((a, b) => {
            const priorityOrder = { high: 3, medium: 2, low: 1 };
            if (priorityOrder[a.priority] !== priorityOrder[b.priority]) {
                return priorityOrder[b.priority] - priorityOrder[a.priority];
            }
            return new Date(b.createdAt) - new Date(a.createdAt);
        });
    }, [todos, filter, debouncedSearchTerm]); // 의존성 배열

    // 🎯 성능 최적화: useCallback으로 함수 메모이제이션
    const addTodo = useCallback(() => {
        if (inputText.trim() === '') {
            alert('할 일을 입력해주세요!');
            return;
        }

        const newTodo = {
            id: Date.now(),
            text: inputText.trim(),
            completed: false,
            priority: priority,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };

        setTodos(prevTodos => [...prevTodos, newTodo]);
        setInputText('');
        setPriority('low');
    }, [inputText, priority, setTodos]);

    const toggleTodo = useCallback((id) => {
        setTodos(prevTodos =>
            prevTodos.map(todo =>
                todo.id === id
                    ? { 
                        ...todo, 
                        completed: !todo.completed,
                        updatedAt: new Date().toISOString()
                    }
                    : todo
            )
        );
    }, [setTodos]);

    const deleteTodo = useCallback((id) => {
        if (window.confirm('정말로 삭제하시겠습니까?')) {
            setTodos(prevTodos => prevTodos.filter(todo => todo.id !== id));
        }
    }, [setTodos]);

    const editTodo = useCallback((id, newText) => {
        if (newText.trim() === '') return;
        
        setTodos(prevTodos =>
            prevTodos.map(todo =>
                todo.id === id
                    ? { 
                        ...todo, 
                        text: newText.trim(),
                        updatedAt: new Date().toISOString()
                    }
                    : todo
            )
        );
    }, [setTodos]);

    // 통계 계산 (useMemo로 최적화)
    const stats = useMemo(() => {
        const total = todos.length;
        const completed = todos.filter(todo => todo.completed).length;
        const active = total - completed;
        const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0;
        
        return { total, completed, active, completionRate };
    }, [todos]);

    // 🎯 useEffect 예제들
    
    // 페이지 제목 동적 변경
    useEffect(() => {
        const activeCount = stats.active;
        document.title = activeCount > 0 
            ? `할 일 (${activeCount}개 남음)` 
            : 'React 할 일 관리';
    }, [stats.active]);

    // 로그 출력 (개발용)
    useEffect(() => {
        console.log('🔄 앱 상태 변경:', {
            totalTodos: todos.length,
            filter,
            searchTerm,
            isOnline
        });
    }, [todos.length, filter, searchTerm, isOnline]);

    // 키보드 단축키
    useEffect(() => {
        const handleKeyPress = (e) => {
            // Ctrl + / : 검색 포커스
            if (e.ctrlKey && e.key === '/') {
                e.preventDefault();
                document.getElementById('searchInput')?.focus();
            }
        };

        document.addEventListener('keydown', handleKeyPress);
        
        return () => {
            document.removeEventListener('keydown', handleKeyPress);
        };
    }, []);

    // Enter 키 처리
    const handleKeyPress = useCallback((e) => {
        if (e.key === 'Enter') {
            addTodo();
        }
    }, [addTodo]);

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 py-8 px-4">
            <div className="max-w-2xl mx-auto">
                {/* 🟢 상태 표시 헤더 */}
                <StatusHeader 
                    isOnline={isOnline}
                    currentTime={currentTime}
                    stats={stats}
                />
                
                {/* 할 일 추가 섹션 */}
                <AddTodoSection 
                    inputText={inputText}
                    setInputText={setInputText}
                    priority={priority}
                    setPriority={setPriority}
                    onAddTodo={addTodo}
                    onKeyPress={handleKeyPress}
                />
                
                {/* 🟢 검색 및 필터 섹션 */}
                <SearchAndFilterSection 
                    searchTerm={searchTerm}
                    setSearchTerm={setSearchTerm}
                    filter={filter}
                    setFilter={setFilter}
                />
                
                {/* 통계 섹션 */}
                <StatsSection stats={stats} />
                
                {/* 할 일 목록 */}
                <TodoList 
                    todos={filteredAndSortedTodos}
                    onToggle={toggleTodo}
                    onDelete={deleteTodo}
                    onEdit={editTodo}
                />
                
                {/* 🟢 개발자 정보 */}
                <DeveloperInfo todos={todos} />
            </div>
        </div>
    );
}

// 🎯 상태 표시 헤더 컴포넌트
function StatusHeader({ isOnline, currentTime, stats }) {
    return (
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
            <div className="text-center mb-4">
                <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-2">
                    📋 React 할 일 관리 (심화)
                </h1>
                <p className="text-gray-600">useEffect와 커스텀 Hook 마스터하기</p>
            </div>
            
            {/* 실시간 상태 표시 */}
            <div className="flex justify-between items-center text-sm bg-gray-50 rounded-lg p-3">
                <div className="flex items-center gap-2">
                    <span className={`w-2 h-2 rounded-full ${isOnline ? 'bg-green-500' : 'bg-red-500'}`}></span>
                    <span className={isOnline ? 'text-green-700' : 'text-red-700'}>
                        {isOnline ? '온라인' : '오프라인'}
                    </span>
                </div>
                
                <div className="text-gray-600">
                    🕐 {currentTime.toLocaleTimeString('ko-KR')}
                </div>
                
                <div className="text-blue-600 font-medium">
                    완료율: {stats.completionRate}%
                </div>
            </div>
        </div>
    );
}

// 🎯 검색 및 필터 섹션
function SearchAndFilterSection({ searchTerm, setSearchTerm, filter, setFilter }) {
    return (
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
            <h3 className="text-xl font-semibold mb-4 text-gray-800">🔍 검색 및 필터</h3>
            
            {/* 검색 입력 */}
            <div className="mb-4">
                <input
                    id="searchInput"
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="할 일 검색... (Ctrl + / 단축키)"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                />
            </div>
            
            {/* 필터 버튼들 */}
            <div className="flex gap-2 flex-wrap">
                {[
                    { value: 'all', label: '전체', emoji: '📋' },
                    { value: 'active', label: '진행중', emoji: '⏳' },
                    { value: 'completed', label: '완료됨', emoji: '✅' }
                ].map(f => (
                    <button
                        key={f.value}
                        onClick={() => setFilter(f.value)}
                        className={`px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
                            filter === f.value
                                ? 'bg-blue-500 text-white shadow-lg'
                                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                    >
                        {f.emoji} {f.label}
                    </button>
                ))}
            </div>
        </div>
    );
}

// 기존 컴포넌트들 (AddTodoSection, StatsSection, TodoList 등)
function AddTodoSection({ inputText, setInputText, priority, setPriority, onAddTodo, onKeyPress }) {
    return (
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
            <h3 className="text-xl font-semibold mb-4 text-gray-800">🆕 새 할 일 추가</h3>
            
            <div className="space-y-4">
                <input
                    type="text"
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                    onKeyPress={onKeyPress}
                    placeholder="할 일을 입력하세요..."
                    maxLength={100}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-lg"
                />
                
                <div className="flex items-center gap-4">
                    <label className="text-gray-700 font-medium">우선순위:</label>
                    <select
                        value={priority}
                        onChange={(e) => setPriority(e.target.value)}
                        className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                    >
                        <option value="low">낮음</option>
                        <option value="medium">보통</option>
                        <option value="high">높음</option>
                    </select>
                    
                    <button
                        onClick={onAddTodo}
                        className="px-6 py-2 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-lg hover:from-blue-600 hover:to-purple-600 transition-all duration-200 font-medium"
                    >
                        ➕ 추가하기
                    </button>
                </div>
            </div>
        </div>
    );
}

function StatsSection({ stats }) {
    return (
        <div className="bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-2xl shadow-lg p-6 mb-6">
            <div className="grid grid-cols-4 gap-4 text-center">
                <div>
                    <div className="text-3xl font-bold">{stats.total}</div>
                    <div className="text-blue-100">전체</div>
                </div>
                <div>
                    <div className="text-3xl font-bold">{stats.active}</div>
                    <div className="text-blue-100">진행중</div>
                </div>
                <div>
                    <div className="text-3xl font-bold">{stats.completed}</div>
                    <div className="text-blue-100">완료</div>
                </div>
                <div>
                    <div className="text-3xl font-bold">{stats.completionRate}%</div>
                    <div className="text-blue-100">완료율</div>
                </div>
            </div>
        </div>
    );
}

function TodoList({ todos, onToggle, onDelete, onEdit }) {
    if (todos.length === 0) {
        return (
            <div className="bg-white rounded-2xl shadow-lg p-12 mb-6 text-center text-gray-500">
                <div className="text-6xl mb-4">📭</div>
                <h3 className="text-xl font-semibold mb-2">조건에 맞는 할 일이 없습니다</h3>
                <p>검색어나 필터를 확인해보세요!</p>
            </div>
        );
    }

    return (
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
            <h3 className="text-xl font-semibold mb-4 text-gray-800">
                📝 할 일 목록 ({todos.length}개)
            </h3>
            <div className="space-y-3">
                {todos.map(todo => (
                    <TodoItem
                        key={todo.id}
                        todo={todo}
                        onToggle={onToggle}
                        onDelete={onDelete}
                        onEdit={onEdit}
                    />
                ))}
            </div>
        </div>
    );
}

function TodoItem({ todo, onToggle, onDelete, onEdit }) {
    const [isEditing, setIsEditing] = useState(false);
    const [editText, setEditText] = useState(todo.text);

    const handleEdit = () => {
        if (editText.trim()) {
            onEdit(todo.id, editText);
            setIsEditing(false);
        }
    };

    const priorityConfig = {
        high: { bg: 'bg-red-100', text: 'text-red-800', label: '높음' },
        medium: { bg: 'bg-yellow-100', text: 'text-yellow-800', label: '보통' },
        low: { bg: 'bg-green-100', text: 'text-green-800', label: '낮음' }
    };

    const priority = priorityConfig[todo.priority];

    return (
        <div className={`p-4 border-2 rounded-lg transition-all duration-200 ${
            todo.completed ? 'bg-gray-50 border-gray-200' : 'bg-white border-gray-200 hover:border-blue-300'
        }`}>
            <div className="flex items-center gap-4">
                <input
                    type="checkbox"
                    checked={todo.completed}
                    onChange={() => onToggle(todo.id)}
                    className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500"
                />
                
                <div className="flex-1">
                    {isEditing ? (
                        <input
                            type="text"
                            value={editText}
                            onChange={(e) => setEditText(e.target.value)}
                            onKeyPress={(e) => e.key === 'Enter' && handleEdit()}
                            onBlur={handleEdit}
                            className="w-full px-2 py-1 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                            autoFocus
                        />
                    ) : (
                        <span
                            className={`text-lg ${
                                todo.completed 
                                    ? 'line-through text-gray-500' 
                                    : 'text-gray-800'
                            }`}
                        >
                            {todo.text}
                        </span>
                    )}
                </div>
                
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${priority.bg} ${priority.text}`}>
                    {priority.label}
                </span>
                
                <div className="flex gap-2">
                    <button
                        onClick={() => setIsEditing(!isEditing)}
                        className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all duration-200"
                        title="수정"
                    >
                        ✏️
                    </button>
                    <button
                        onClick={() => onDelete(todo.id)}
                        className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all duration-200"
                        title="삭제"
                    >
                        🗑️
                    </button>
                </div>
            </div>
            
            <div className="mt-2 text-xs text-gray-500">
                생성: {new Date(todo.createdAt).toLocaleString('ko-KR')}
                {todo.updatedAt !== todo.createdAt && (
                    <> | 수정: {new Date(todo.updatedAt).toLocaleString('ko-KR')}</>
                )}
            </div>
        </div>
    );
}

// 🎯 개발자 정보 컴포넌트
function DeveloperInfo({ todos }) {
    const [showDetails, setShowDetails] = useState(false);
    
    return (
        <div className="bg-gradient-to-r from-green-50 to-blue-50 border-l-4 border-green-500 rounded-lg p-6">
            <div className="flex justify-between items-center mb-3">
                <h3 className="text-lg font-semibold text-green-800">
                    🧑‍💻 React 심화 기능들
                </h3>
                <button
                    onClick={() => setShowDetails(!showDetails)}
                    className="text-sm bg-green-100 text-green-800 px-3 py-1 rounded-full hover:bg-green-200 transition-all"
                >
                    {showDetails ? '간단히 보기' : '자세히 보기'}
                </button>
            </div>
            
            {showDetails && (
                <div className="grid md:grid-cols-2 gap-4 text-sm">
                    <div>
                        <h4 className="font-semibold text-blue-700 mb-2">🎣 사용된 Hook들:</h4>
                        <ul className="space-y-1 text-gray-700">
                            <li>• useLocalStorage (커스텀)</li>
                            <li>• useOnlineStatus (커스텀)</li>
                            <li>• useCurrentTime (커스텀)</li>
                            <li>• useMemo (성능 최적화)</li>
                            <li>• useCallback (함수 메모이제이션)</li>
                            <li>• useEffect (생명주기)</li>
                        </ul>
                    </div>
                    <div>
                        <h4 className="font-semibold text-purple-700 mb-2">🚀 새로운 기능들:</h4>
                        <ul className="space-y-1 text-gray-700">
                            <li>• 실시간 시계</li>
                            <li>• 온라인/오프라인 감지</li>
                            <li>• 검색 기능 (Ctrl + /)</li>
                            <li>• 페이지 제목 동적 변경</li>
                            <li>• 완료율 표시</li>
                            <li>• 성능 최적화</li>
                        </ul>
                    </div>
                </div>
            )}
            
            <div className="mt-4 text-xs text-gray-600">
                💾 총 {todos.length}개 할 일이 로컬스토리지에 저장됨
            </div>
        </div>
    );
}

export default App;