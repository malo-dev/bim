#!/usr/bin/env bash
# Diagnostic mémoire des builds EAS (machines Linux d'Expo).
#   start : affiche la mémoire et lance un relevé toutes les 10 s
#   report: affiche les derniers relevés et les traces « OOM killer » du noyau
# N'échoue jamais : un diagnostic ne doit pas casser le build.
LOG=/tmp/bim-mem.log

case "$1" in
  start)
    echo "===== [BIM] Machine de build ====="
    echo "Processeurs : $(nproc 2>/dev/null)"
    free -h 2>/dev/null || cat /proc/meminfo | head -5
    echo "Swap :"; swapon --show 2>/dev/null || echo "(aucun)"
    echo "Limite mémoire du conteneur (cgroup) :"
    cat /sys/fs/cgroup/memory.max 2>/dev/null || cat /sys/fs/cgroup/memory/memory.limit_in_bytes 2>/dev/null || echo "(inconnue)"
    nohup setsid bash -c "while true; do echo \"\$(date +%T) \$(free -m | awk '/Mem:/{print \"utilise=\"\$3\" Mo  disponible=\"\$7\" Mo\"}') \$(ps -eo rss,comm --sort=-rss | awk 'NR>1 && NR<5 {printf \"%s=%d Mo  \", \$2, \$1/1024}')\" >> $LOG; sleep 10; done" > /dev/null 2>&1 &
    echo "Relevé mémoire lancé (toutes les 10 s)."
    ;;
  report)
    echo "===== [BIM] Mémoire au moment de l'échec ====="
    free -h 2>/dev/null
    echo "----- 40 derniers relevés (10 s) -----"
    tail -n 40 "$LOG" 2>/dev/null || echo "(aucun relevé)"
    echo "----- Pic d'utilisation relevé -----"
    sort -t= -k2 -n "$LOG" 2>/dev/null | awk -F'utilise=' '{split($2,a," "); if (a[1]+0>m) {m=a[1]+0; l=$0}} END {print l}'
    echo "----- Traces du noyau (OOM killer) -----"
    (dmesg 2>/dev/null || journalctl -k --no-pager 2>/dev/null) | grep -iE "out of memory|oom|killed process" | tail -n 20 || true
    grep -h -iE "oom" /sys/fs/cgroup/memory.events 2>/dev/null || true
    ;;
esac
exit 0
