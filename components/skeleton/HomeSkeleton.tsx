import React from "react";
import { View, StyleSheet } from "react-native";
import SkeletonBlock from '@/components/SkeletonBlock'

export default function HomeSkeleton() {
  return (
    <View style={styles.container}>

    
    
      <View style={styles.card}>
        {[1,2,3,4,5,6].map(i => (
          <SkeletonBlock
            key={i}
            width="30%"
            height={90}
            radius={18}
          />
        ))}
      </View>
       <View style={styles.card}>
        {[1,2,3,4,5,6].map(i => (
          <SkeletonBlock
            key={i}
            width="30%"
            height={90}
            radius={18}
          />
        ))}
      </View>

      {/* Services */}
      <View style={styles.card}>
        <SkeletonBlock width={120} height={18} />

        <View style={styles.grid}>
          {[1,2,3,4,5,6].map(i => (
            <SkeletonBlock
              key={i}
              width="30%"
              height={90}
              radius={18}
            />
          ))}
        </View>
      </View>

    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F6F7FB",
    paddingTop:20
  },
  card: {
    margin: 20,
    padding: 16,
    backgroundColor: "#FFF",
    borderRadius: 22,
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
});
