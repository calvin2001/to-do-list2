import { useState, useEffect } from 'react';

// 🎯 메인 App 컴포넌트
function App() {
    // 🟢 React 상태 관리
    const [todos, setTodos] = useState([]);
    const [inputText, setInputText] = useState('');
    const [filter, setFilter] = useState('all');
    const [priority, setPriority] = useState('low');

    // 🟢 컴포넌트 마운트 시 데이터 로드
    useEffect(() => {
        loadTodosFromStorage();
    }, []);

    // 🟢 todos 변경 시 자동 저장
    useEffect(() => {
        if (todos.length > 0) {
            saveTodosToStorage();
        }
    }, [todos]);

    // 🎯 핵심 함수들
    
    // 할 일 추가
    const addTodo = () => {
        if (inputText.trim() === '') {
            alert('할 일을 입력해주세요!');
            return;
        }

        const newTodo = {
            id: Date.now(),
            text: inputText.trim(),
            completed: false,
            priority: priority,
            createdAt: new Date().toLocaleString('ko-KR')
        };

        setTodos(prevTodos => [...prevTodos, newTodo]);
        setInputText('');
        setPriority('low');
    };

    // 할 일 완료/미완료 토글
    const toggleTodo = (id) => {
        setTodos(prevTodos =>
            prevTodos.map(todo =>
                todo.id === id
                    ? { ...todo, completed: !todo.completed }
                    : todo
            )
        );
    };

    // 할 일 삭제
    const deleteTodo = (id) => {
        if (window.confirm('정말로 삭제하시겠습니까?')) {
            setTodos(prevTodos => prevTodos.filter(todo => todo.id !== id));
        }
    };

    // 할 일 수정
    const editTodo = (id, newText) => {
        if (newText.trim() === '') return;
        
        setTodos(prevTodos =>
            prevTodos.map(todo =>
                todo.id === id
                    ? { ...todo, text: newText.trim() }
                    : todo
            )
        );
    };

    // 우선순위 변경
    const changePriority = (id) => {
        const priorities = ['low', 'medium', 'high'];
        
        setTodos(prevTodos =>
            prevTodos.map(todo => {
                if (todo.id === id) {
                    const currentIndex = priorities.indexOf(todo.priority);
                    const nextIndex = (currentIndex + 1) % priorities.length;
                    return { ...todo, priority: priorities[nextIndex] };
                }
                return todo;
            })
        );
    };

    // 전체 삭제
    const clearAllTodos = () => {
        if (todos.length === 0) {
            alert('삭제할 할 일이 없습니다.');
            return;
        }
        if (window.confirm(`모든 할 일 ${todos.length}개를 정말 삭제하시겠습니까?`)) {
            setTodos([]);
        }
    };

    // 완료된 할 일만 삭제
    const clearCompletedTodos = () => {
        const completedTodos = todos.filter(todo => todo.completed);
        if (completedTodos.length === 0) {
            alert('완료된 할 일이 없습니다.');
            return;
        }
        if (window.confirm(`완료된 할 일 ${completedTodos.length}개를 삭제하시겠습니까?`)) {
            setTodos(prevTodos => prevTodos.filter(todo => !todo.completed));
        }
    };

    // 🎯 필터링된 할 일 목록
    const filteredTodos = todos.filter(todo => {
        if (filter === 'active' && todo.completed) return false;
        if (filter === 'completed' && !todo.completed) return false;
        return true;
    });

    // 우선순위별 정렬
    const sortedTodos = [...filteredTodos].sort((a, b) => {
        const priorityOrder = { high: 3, medium: 2, low: 1 };
        return priorityOrder[b.priority] - priorityOrder[a.priority];
    });

    // 통계 계산
    const stats = {
        total: todos.length,
        completed: todos.filter(todo => todo.completed).length,
        active: todos.filter(todo => !todo.completed).length
    };

    // 로컬스토리지 함수들
    const saveTodosToStorage = () => {
        try {
            localStorage.setItem('react-todos', JSON.stringify(todos));
        } catch (error) {
            console.error('저장 실패:', error);
        }
    };

    const loadTodosFromStorage = () => {
        try {
            const stored = localStorage.getItem('react-todos');
            if (stored) {
                setTodos(JSON.parse(stored));
            } else {
                // 샘플 데이터
                const sampleTodos = [
                    {
                        id: Date.now() - 3000,
                        text: 'React 기본기 익히기',
                        completed: false,
                        priority: 'high',
                        createdAt: new Date().toLocaleString('ko-KR')
                    },
                    {
                        id: Date.now() - 2000,
                        text: 'JSX 문법 연습하기',
                        completed: false,
                        priority: 'medium',
                        createdAt: new Date().toLocaleString('ko-KR')
                    },
                    {
                        id: Date.now() - 1000,
                        text: '바닐라 JS와 비교해보기',
                        completed: true,
                        priority: 'low',
                        createdAt: new Date().toLocaleString('ko-KR')
                    }
                ];
                setTodos(sampleTodos);
            }
        } catch (error) {
            console.error('불러오기 실패:', error);
            setTodos([]);
        }
    };

    // Enter 키 처리
    const handleKeyPress = (e) => {
        if (e.key === 'Enter') {
            addTodo();
        }
    };

    // 🎯 JSX 반환
    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 py-8 px-4">
            <div className="max-w-2xl mx-auto">
                {/* 헤더 */}
                <Header />
                
                {/* 할 일 추가 섹션 */}
                <AddTodoSection 
                    inputText={inputText}
                    setInputText={setInputText}
                    priority={priority}
                    setPriority={setPriority}
                    onAddTodo={addTodo}
                    onKeyPress={handleKeyPress}
                />
                
                {/* 필터 섹션 */}
                <FilterSection 
                    filter={filter}
                    setFilter={setFilter}
                />
                
                {/* 통계 섹션 */}
                <StatsSection stats={stats} />
                
                {/* 할 일 목록 */}
                <TodoList 
                    todos={sortedTodos}
                    onToggle={toggleTodo}
                    onDelete={deleteTodo}
                    onEdit={editTodo}
                    onChangePriority={changePriority}
                />
                
                {/* 액션 버튼들 */}
                <ActionButtons 
                    onClearAll={clearAllTodos}
                    onClearCompleted={clearCompletedTodos}
                    todosCount={todos.length}
                    completedCount={stats.completed}
                />
                
                {/* React vs 바닐라 JS 비교 */}
                <ComparisonNote />
            </div>
        </div>
    );
}

// 🎯 컴포넌트들
function Header() {
    return (
        <div className="bg-white rounded-2xl shadow-lg p-8 mb-6 text-center">
            <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-2">
                📋 React 할 일 관리
            </h1>
            <p className="text-gray-600">컴포넌트 기반 개발의 힘을 체험해보세요!</p>
        </div>
    );
}

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

function FilterSection({ filter, setFilter }) {
    const filters = [
        { value: 'all', label: '전체', emoji: '📋' },
        { value: 'active', label: '진행중', emoji: '⏳' },
        { value: 'completed', label: '완료됨', emoji: '✅' }
    ];

    return (
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
            <h3 className="text-xl font-semibold mb-4 text-gray-800">🔍 필터</h3>
            <div className="flex gap-2 flex-wrap">
                {filters.map(f => (
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

function StatsSection({ stats }) {
    return (
        <div className="bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-2xl shadow-lg p-6 mb-6">
            <div className="flex justify-around text-center">
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
            </div>
        </div>
    );
}

function TodoList({ todos, onToggle, onDelete, onEdit, onChangePriority }) {
    if (todos.length === 0) {
        return (
            <div className="bg-white rounded-2xl shadow-lg p-12 mb-6 text-center text-gray-500">
                <div className="text-6xl mb-4">📭</div>
                <h3 className="text-xl font-semibold mb-2">할 일이 없습니다</h3>
                <p>새로운 할 일을 추가해보세요!</p>
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
                        onChangePriority={onChangePriority}
                    />
                ))}
            </div>
        </div>
    );
}

function TodoItem({ todo, onToggle, onDelete, onEdit, onChangePriority }) {
    const [isEditing, setIsEditing] = useState(false);
    const [editText, setEditText] = useState(todo.text);

    const handleEdit = () => {
        if (editText.trim()) {
            onEdit(todo.id, editText);
            setIsEditing(false);
        }
    };

    const handleKeyPress = (e) => {
        if (e.key === 'Enter') {
            handleEdit();
        } else if (e.key === 'Escape') {
            setIsEditing(false);
            setEditText(todo.text);
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
                            onKeyPress={handleKeyPress}
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
                        onClick={() => onChangePriority(todo.id)}
                        className="p-2 text-gray-600 hover:text-orange-600 hover:bg-orange-50 rounded-lg transition-all duration-200"
                        title="우선순위 변경"
                    >
                        🎯
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
            
            <div className="mt-2 text-sm text-gray-500">
                생성: {todo.createdAt}
            </div>
        </div>
    );
}

function ActionButtons({ onClearAll, onClearCompleted, todosCount, completedCount }) {
    return (
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
            <div className="flex gap-4 justify-center flex-wrap">
                <button
                    onClick={onClearAll}
                    disabled={todosCount === 0}
                    className="px-6 py-3 bg-red-500 text-white rounded-lg hover:bg-red-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-all duration-200 font-medium"
                >
                    🗑️ 전체 삭제 ({todosCount}개)
                </button>
                <button
                    onClick={onClearCompleted}
                    disabled={completedCount === 0}
                    className="px-6 py-3 bg-orange-500 text-white rounded-lg hover:bg-orange-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-all duration-200 font-medium"
                >
                    ✅ 완료된 항목 삭제 ({completedCount}개)
                </button>
            </div>
        </div>
    );
}

function ComparisonNote() {
    return (
        <div className="bg-gradient-to-r from-green-50 to-blue-50 border-l-4 border-green-500 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-green-800 mb-3">
                🎯 React vs 바닐라 JavaScript 비교
            </h3>
            <div className="grid md:grid-cols-2 gap-4 text-sm">
                <div>
                    <h4 className="font-semibold text-red-700 mb-2">❌ 바닐라 JS의 문제점:</h4>
                    <ul className="space-y-1 text-gray-700">
                        <li>• DOM 직접 조작으로 복잡함</li>
                        <li>• 상태와 UI 동기화 어려움</li>
                        <li>• 코드 재사용 한계</li>
                        <li>• 수동으로 이벤트 관리</li>
                    </ul>
                </div>
                <div>
                    <h4 className="font-semibold text-green-700 mb-2">✅ React의 장점:</h4>
                    <ul className="space-y-1 text-gray-700">
                        <li>• 상태 변경시 자동 UI 업데이트</li>
                        <li>• 컴포넌트로 코드 재사용</li>
                        <li>• 선언적 프로그래밍</li>
                        <li>• 개발자 도구 강력함</li>
                    </ul>
                </div>
            </div>
        </div>
    );
}

export default App;